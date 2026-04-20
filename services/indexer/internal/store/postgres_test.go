package store

import (
	"context"
	"os"
	"testing"
	"time"
)

func getTestDB(t *testing.T) *PostgresStore {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		url = "postgresql://explorer:explorer_dev@localhost:54320/stellar_explorer?sslmode=disable"
	}
	store, err := NewPostgresStore(url)
	if err != nil {
		t.Skipf("Skipping: cannot connect to test database: %v", err)
	}
	return store
}

func TestInsertLedger(t *testing.T) {
	store := getTestDB(t)
	defer store.Close()

	now := time.Now().UTC().Truncate(time.Microsecond)
	ledger := &Ledger{
		Sequence:          99999999,
		Hash:              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		PrevHash:          "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		ClosedAt:          now,
		TotalCoins:        1000000000000,
		FeePool:           100000,
		BaseFee:           100,
		BaseReserve:       5000000,
		MaxTxSetSize:      1000,
		ProtocolVersion:   21,
		TransactionCount:  5,
		OperationCount:    10,
		SuccessfulTxCount: 4,
		FailedTxCount:     1,
	}

	ctx := context.Background()

	err := store.InsertLedger(ctx, ledger)
	if err != nil {
		t.Fatalf("InsertLedger failed: %v", err)
	}

	// Insert again — should be idempotent (ON CONFLICT DO NOTHING)
	err = store.InsertLedger(ctx, ledger)
	if err != nil {
		t.Fatalf("Idempotent InsertLedger failed: %v", err)
	}

	// Clean up test data
	_, _ = store.db.ExecContext(ctx, "DELETE FROM ledgers WHERE sequence = 99999999")
}

func TestInsertTransactionBatch(t *testing.T) {
	store := getTestDB(t)
	defer store.Close()

	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Microsecond)

	txs := []Transaction{
		{
			Hash:             "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
			LedgerSequence:   88888888,
			ApplicationOrder: 1,
			Account:          "GABC",
			AccountSequence:  100,
			FeeCharged:       100,
			MaxFee:           200,
			OperationCount:   1,
			MemoType:         0,
			Status:           1,
			IsSoroban:        false,
			EnvelopeXDR:      "AAAA",
			ResultXDR:        "BBBB",
			CreatedAt:        now,
		},
	}

	err := store.InsertTransactionBatch(ctx, txs)
	if err != nil {
		t.Fatalf("InsertTransactionBatch failed: %v", err)
	}

	// Insert again — idempotent
	err = store.InsertTransactionBatch(ctx, txs)
	if err != nil {
		t.Fatalf("Idempotent InsertTransactionBatch failed: %v", err)
	}

	// Empty batch should be no-op
	err = store.InsertTransactionBatch(ctx, nil)
	if err != nil {
		t.Fatalf("Empty InsertTransactionBatch failed: %v", err)
	}

	// Clean up
	_, _ = store.db.ExecContext(ctx, "DELETE FROM transactions WHERE hash = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'")
}

func TestInsertOperationBatch(t *testing.T) {
	store := getTestDB(t)
	defer store.Close()

	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Microsecond)
	typeName := "payment"

	ops := []Operation{
		{
			TransactionID:    0,
			TransactionHash:  "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
			ApplicationOrder: 1,
			Type:             1,
			TypeName:         typeName,
			Details:          `{"type": "payment"}`,
			CreatedAt:        now,
		},
	}

	err := store.InsertOperationBatch(ctx, ops)
	if err != nil {
		t.Fatalf("InsertOperationBatch failed: %v", err)
	}

	// Clean up
	_, _ = store.db.ExecContext(ctx, "DELETE FROM operations WHERE transaction_hash = 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'")
}

func TestIngestionState(t *testing.T) {
	store := getTestDB(t)
	defer store.Close()

	ctx := context.Background()

	// Clean up first to ensure a fresh state
	_, _ = store.db.ExecContext(ctx, "DELETE FROM ingestion_state WHERE key = 'last_ingested_ledger'")

	err := store.SetLastIngestedLedger(ctx, 12345)
	if err != nil {
		t.Fatalf("SetLastIngestedLedger failed: %v", err)
	}

	seq, err := store.GetLastIngestedLedger(ctx)
	if err != nil {
		t.Fatalf("GetLastIngestedLedger failed: %v", err)
	}
	if seq != 12345 {
		t.Errorf("expected 12345, got %d", seq)
	}

	// Verify forward-only: setting a lower value should not regress
	err = store.SetLastIngestedLedger(ctx, 100)
	if err != nil {
		t.Fatalf("SetLastIngestedLedger (lower) failed: %v", err)
	}
	seq, err = store.GetLastIngestedLedger(ctx)
	if err != nil {
		t.Fatalf("GetLastIngestedLedger after lower set failed: %v", err)
	}
	if seq != 12345 {
		t.Errorf("cursor should not regress: expected 12345, got %d", seq)
	}

	// Clean up
	_, _ = store.db.ExecContext(ctx, "DELETE FROM ingestion_state WHERE key = 'last_ingested_ledger'")
}
