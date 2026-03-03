package pipeline

import (
	"context"
	"testing"
)

func TestBackfillSmallRange(t *testing.T) {
	rpc, db := getTestDeps(t)
	defer db.Close()

	ctx := context.Background()

	// Get latest ledger
	latest, err := rpc.GetLatestLedger(ctx)
	if err != nil {
		t.Fatalf("GetLatestLedger failed: %v", err)
	}

	// Backfill 5 ledgers with 2 workers
	start := latest.Sequence - 6
	end := latest.Sequence - 2
	p := NewBackfillPipeline(rpc, db, 3, 2)

	err = p.Run(ctx, start, end)
	if err != nil {
		t.Fatalf("Backfill failed: %v", err)
	}

	t.Logf("Backfill completed: ledgers %d-%d", start, end)

	// Clean up
	for seq := start; seq <= end; seq++ {
		cleanupTestLedgers(t, db, seq)
	}
}
