package pipeline

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/miguelnietoa/stellar-explorer/indexer/internal/source"
	"github.com/miguelnietoa/stellar-explorer/indexer/internal/store"
)

func getTestDeps(t *testing.T) (*source.RPCClient, *store.PostgresStore) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://explorer:explorer_dev@localhost:54320/stellar_explorer?sslmode=disable"
	}
	db, err := store.NewPostgresStore(dbURL)
	if err != nil {
		t.Skipf("Skipping: cannot connect to test database: %v", err)
	}

	rpcEndpoint := os.Getenv("TEST_RPC_ENDPOINT")
	if rpcEndpoint == "" {
		rpcEndpoint = "https://soroban-testnet.stellar.org"
	}
	rpc := source.NewRPCClient(rpcEndpoint)

	return rpc, db
}

func TestProcessLedgerBatch(t *testing.T) {
	rpc, db := getTestDeps(t)
	defer db.Close()

	ctx := context.Background()

	// Get latest ledger from testnet
	latest, err := rpc.GetLatestLedger(ctx)
	if err != nil {
		t.Fatalf("GetLatestLedger failed: %v", err)
	}

	// Process 2 ledgers from near the tip
	p := NewLivePipeline(rpc, db, 10)
	start := latest.Sequence - 3
	count, err := p.processLedgerBatch(ctx, start, 2)
	if err != nil {
		t.Fatalf("processLedgerBatch failed: %v", err)
	}

	if count != 2 {
		t.Errorf("expected 2 ledgers processed, got %d", count)
	}

	// Verify cursor was updated
	lastIngested, err := db.GetLastIngestedLedger(ctx)
	if err != nil {
		t.Fatalf("GetLastIngestedLedger failed: %v", err)
	}
	expectedCursor := start + 1 // second ledger in the batch
	if lastIngested != expectedCursor {
		t.Errorf("expected cursor at %d, got %d", expectedCursor, lastIngested)
	}

	t.Logf("Successfully ingested ledgers %d-%d, cursor at %d", start, start+1, lastIngested)

	// Clean up
	cleanupTestLedgers(t, db, start, start+1)
}

func TestLivePipelineRunAndStop(t *testing.T) {
	rpc, db := getTestDeps(t)
	defer db.Close()

	p := NewLivePipeline(rpc, db, 5)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	errCh := make(chan error, 1)
	go func() {
		errCh <- p.Run(ctx)
	}()

	// Let it run for a few seconds
	time.Sleep(5 * time.Second)
	cancel()

	err := <-errCh
	if err != nil && err != context.Canceled && err != context.DeadlineExceeded {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify some ledgers were ingested
	lastIngested, err := db.GetLastIngestedLedger(context.Background())
	if err != nil {
		t.Fatalf("GetLastIngestedLedger failed: %v", err)
	}

	if lastIngested == 0 {
		t.Error("expected at least one ledger to be ingested")
	}

	t.Logf("Pipeline ran successfully, last ingested ledger: %d", lastIngested)
}

func cleanupTestLedgers(t *testing.T, db *store.PostgresStore, sequences ...uint32) {
	t.Helper()
	ctx := context.Background()
	for _, seq := range sequences {
		db.CleanupTestData(ctx, seq)
	}
}
