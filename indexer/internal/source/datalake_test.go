package source

import (
	"context"
	"errors"
	"io"
	"testing"
	"time"

	"github.com/stellar/go-stellar-sdk/ingest"
	"github.com/stellar/go-stellar-sdk/ingest/ledgerbackend"
	"github.com/stellar/go-stellar-sdk/network"
	"github.com/stellar/go-stellar-sdk/xdr"
)

func fetchTestLedgerCloseMeta(t *testing.T, seq uint32) xdr.LedgerCloseMeta {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	var result xdr.LedgerCloseMeta
	found := false

	// ApplyLedgerMetadata requires To > From for bounded ranges, so we use
	// BoundedRange(seq, seq+1) and stop after capturing the target ledger.
	err := ingest.ApplyLedgerMetadata(
		ledgerbackend.BoundedRange(seq, seq+1),
		PubnetPublisherConfig(),
		ctx,
		func(lcm xdr.LedgerCloseMeta) error {
			if lcm.LedgerSequence() == seq {
				result = lcm
				found = true
				return context.Canceled
			}
			return nil
		},
	)
	if err != nil && !errors.Is(err, context.Canceled) && ctx.Err() == nil {
		t.Fatalf("fetch ledger %d from S3: %v", seq, err)
	}
	if !found {
		t.Fatalf("ledger %d not found in S3 range", seq)
	}
	return result
}

func TestLedgerEntryFromCloseMeta(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping S3 integration test")
	}

	lcm := fetchTestLedgerCloseMeta(t, 100)
	entry, err := LedgerEntryFromCloseMeta(lcm)
	if err != nil {
		t.Fatalf("LedgerEntryFromCloseMeta: %v", err)
	}

	if entry.Sequence != 100 {
		t.Errorf("expected sequence 100, got %d", entry.Sequence)
	}
	if entry.Hash == "" {
		t.Error("expected non-empty hash")
	}
	if entry.HeaderXDR == "" {
		t.Error("expected non-empty HeaderXDR")
	}
	if entry.LedgerCloseTime == "" {
		t.Error("expected non-empty LedgerCloseTime")
	}
}

func TestTransactionEntriesFromCloseMeta(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping S3 integration test")
	}

	lcm := fetchTestLedgerCloseMeta(t, 100)
	entries, err := TransactionEntriesFromCloseMeta(lcm, network.PublicNetworkPassphrase)
	if err != nil {
		t.Fatalf("TransactionEntriesFromCloseMeta: %v", err)
	}

	t.Logf("ledger 100: %d transactions", len(entries))

	for _, entry := range entries {
		if entry.EnvelopeXDR == "" {
			t.Error("expected non-empty EnvelopeXDR")
		}
		if entry.ResultXDR == "" {
			t.Error("expected non-empty ResultXDR")
		}
		if entry.Ledger != 100 {
			t.Errorf("expected ledger 100, got %d", entry.Ledger)
		}
		if entry.Status != "SUCCESS" && entry.Status != "FAILED" {
			t.Errorf("unexpected status: %s", entry.Status)
		}
	}
}

func TestTransactionEntriesWithContent(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping S3 integration test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	var foundLCM xdr.LedgerCloseMeta
	found := false

	err := ingest.ApplyLedgerMetadata(
		ledgerbackend.BoundedRange(30_000_000, 30_000_010),
		PubnetPublisherConfig(),
		ctx,
		func(lcm xdr.LedgerCloseMeta) error {
			reader, err := ingest.NewLedgerTransactionReaderFromLedgerCloseMeta(
				network.PublicNetworkPassphrase, lcm,
			)
			if err != nil {
				return err
			}
			if _, readErr := reader.Read(); readErr != io.EOF {
				foundLCM = lcm
				found = true
				return context.Canceled
			}
			return nil
		},
	)
	if err != nil && !errors.Is(err, context.Canceled) && ctx.Err() == nil {
		if !found {
			t.Fatalf("ApplyLedgerMetadata: %v", err)
		}
	}

	if !found {
		t.Skip("no ledger with transactions found in range 30M-30M+10")
	}

	entries, err := TransactionEntriesFromCloseMeta(foundLCM, network.PublicNetworkPassphrase)
	if err != nil {
		t.Fatalf("TransactionEntriesFromCloseMeta: %v", err)
	}

	if len(entries) == 0 {
		t.Fatal("expected at least one transaction")
	}

	tx := entries[0]
	t.Logf("first tx: status=%s, order=%d, ledger=%d, feeBump=%v",
		tx.Status, tx.ApplicationOrder, tx.Ledger, tx.FeeBump)

	if tx.EnvelopeXDR == "" {
		t.Error("expected non-empty EnvelopeXDR")
	}
	if tx.ResultXDR == "" {
		t.Error("expected non-empty ResultXDR")
	}
	if tx.ResultMetaXDR == "" {
		t.Error("expected non-empty ResultMetaXDR")
	}
	if tx.CreatedAt == 0 {
		t.Error("expected non-zero CreatedAt")
	}
}
