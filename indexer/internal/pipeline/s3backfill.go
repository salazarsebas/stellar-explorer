package pipeline

import (
	"context"
	"fmt"
	"log"
	"sync"
	"sync/atomic"

	"github.com/stellar/go-stellar-sdk/ingest"
	"github.com/stellar/go-stellar-sdk/ingest/ledgerbackend"
	"github.com/stellar/go-stellar-sdk/network"
	"github.com/stellar/go-stellar-sdk/xdr"

	"github.com/miguelnietoa/stellar-explorer/indexer/internal/source"
	"github.com/miguelnietoa/stellar-explorer/indexer/internal/store"
)

// S3BackfillPipeline reads historical ledgers from the Stellar public data lake
// (S3) and ingests them into the database using parallel workers.
type S3BackfillPipeline struct {
	store       *store.PostgresStore
	workerCount int
}

func NewS3BackfillPipeline(store *store.PostgresStore, workerCount int) *S3BackfillPipeline {
	return &S3BackfillPipeline{
		store:       store,
		workerCount: workerCount,
	}
}

// Run processes ledgers from startLedger to endLedger (inclusive) by downloading
// XDR files from the Stellar public data lake on S3.
func (p *S3BackfillPipeline) Run(ctx context.Context, startLedger, endLedger uint32) error {
	if startLedger < 3 {
		startLedger = 3
	}
	if endLedger < startLedger {
		return fmt.Errorf("endLedger (%d) must be >= startLedger (%d)", endLedger, startLedger)
	}

	totalLedgers := endLedger - startLedger + 1
	log.Printf("s3 backfill: processing ledgers %d to %d (%d total) with %d workers",
		startLedger, endLedger, totalLedgers, p.workerCount)

	workers := p.workerCount
	if int(totalLedgers) < workers {
		workers = int(totalLedgers)
	}

	chunkSize := totalLedgers / uint32(workers)
	var processedTotal atomic.Int64
	var wg sync.WaitGroup
	errCh := make(chan error, workers)

	for i := 0; i < workers; i++ {
		wg.Add(1)
		workerStart := startLedger + uint32(i)*chunkSize
		workerEnd := workerStart + chunkSize - 1
		if i == workers-1 {
			workerEnd = endLedger
		}

		go func(id int, start, end uint32) {
			defer wg.Done()
			err := p.runWorker(ctx, id, start, end, &processedTotal)
			if err != nil && ctx.Err() == nil {
				errCh <- fmt.Errorf("worker %d: %w", id, err)
			}
		}(i, workerStart, workerEnd)
	}

	wg.Wait()
	close(errCh)

	var errs []error
	for err := range errCh {
		errs = append(errs, err)
	}

	log.Printf("s3 backfill: completed. processed %d ledgers", processedTotal.Load())

	if len(errs) > 0 {
		return fmt.Errorf("s3 backfill completed with %d errors: %v", len(errs), errs[0])
	}
	return nil
}

func (p *S3BackfillPipeline) runWorker(ctx context.Context, id int, start, end uint32, processed *atomic.Int64) error {
	log.Printf("s3 backfill worker %d: processing ledgers %d to %d", id, start, end)

	pubConfig := source.PubnetPublisherConfig()

	err := ingest.ApplyLedgerMetadata(
		ledgerbackend.BoundedRange(start, end),
		pubConfig,
		ctx,
		func(lcm xdr.LedgerCloseMeta) error {
			ledgerEntry, err := source.LedgerEntryFromCloseMeta(lcm)
			if err != nil {
				return fmt.Errorf("convert ledger %d: %w", lcm.LedgerSequence(), err)
			}

			txEntries, err := source.TransactionEntriesFromCloseMeta(lcm, network.PublicNetworkPassphrase)
			if err != nil {
				return fmt.Errorf("convert transactions for ledger %d: %w", lcm.LedgerSequence(), err)
			}

			if err := ProcessOneLedger(ctx, p.store, nil, ledgerEntry, txEntries); err != nil {
				return fmt.Errorf("process ledger %d: %w", lcm.LedgerSequence(), err)
			}

			total := processed.Add(1)
			if total%1000 == 0 {
				log.Printf("s3 backfill worker %d: progress %d (total across workers: %d)",
					id, lcm.LedgerSequence(), total)
			}

			return nil
		},
	)

	if err != nil {
		return err
	}

	log.Printf("s3 backfill worker %d: done", id)
	return nil
}
