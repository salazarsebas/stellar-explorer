package store

import (
	"context"
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(databaseURL string) (*PostgresStore, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	db.SetMaxOpenConns(50)
	db.SetMaxIdleConns(25)
	return &PostgresStore{db: db}, nil
}

func (s *PostgresStore) InsertLedger(ctx context.Context, ledger *Ledger) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO ledgers (sequence, hash, prev_hash, closed_at, total_coins, fee_pool,
			base_fee, base_reserve, max_tx_set_size, protocol_version,
			transaction_count, operation_count, successful_tx_count, failed_tx_count,
			tx_set_operation_count, header_xdr)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
		ON CONFLICT (sequence, closed_at) DO NOTHING`,
		ledger.Sequence, ledger.Hash, ledger.PrevHash, ledger.ClosedAt,
		ledger.TotalCoins, ledger.FeePool, ledger.BaseFee, ledger.BaseReserve,
		ledger.MaxTxSetSize, ledger.ProtocolVersion, ledger.TransactionCount,
		ledger.OperationCount, ledger.SuccessfulTxCount, ledger.FailedTxCount,
		ledger.TxSetOperationCount, ledger.HeaderXDR,
	)
	return err
}

func (s *PostgresStore) InsertTransactionBatch(ctx context.Context, txs []Transaction) error {
	if len(txs) == 0 {
		return nil
	}
	dbTx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer dbTx.Rollback()

	stmt, err := dbTx.PrepareContext(ctx, `
		INSERT INTO transactions (hash, ledger_sequence, application_order, account,
			account_muxed, account_sequence, fee_charged, max_fee, operation_count,
			memo_type, memo_text, memo_hash, status, is_soroban, soroban_resources,
			envelope_xdr, result_xdr, result_meta_xdr, fee_meta_xdr, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
		ON CONFLICT DO NOTHING`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, t := range txs {
		_, err := stmt.ExecContext(ctx,
			t.Hash, t.LedgerSequence, t.ApplicationOrder, t.Account,
			t.AccountMuxed, t.AccountSequence, t.FeeCharged, t.MaxFee, t.OperationCount,
			t.MemoType, t.MemoText, t.MemoHash, t.Status, t.IsSoroban, t.SorobanResources,
			t.EnvelopeXDR, t.ResultXDR, t.ResultMetaXDR, t.FeeMetaXDR, t.CreatedAt)
		if err != nil {
			return err
		}
	}

	return dbTx.Commit()
}

func (s *PostgresStore) InsertOperationBatch(ctx context.Context, ops []Operation) error {
	if len(ops) == 0 {
		return nil
	}
	dbTx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer dbTx.Rollback()

	stmt, err := dbTx.PrepareContext(ctx, `
		INSERT INTO operations (transaction_id, transaction_hash, application_order,
			type, type_name, source_account, asset_code, asset_issuer, amount,
			destination, contract_id, function_name, details, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT DO NOTHING`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, o := range ops {
		_, err := stmt.ExecContext(ctx,
			o.TransactionID, o.TransactionHash, o.ApplicationOrder,
			o.Type, o.TypeName, o.SourceAccount, o.AssetCode, o.AssetIssuer, o.Amount,
			o.Destination, o.ContractID, o.FunctionName, o.Details, o.CreatedAt)
		if err != nil {
			return err
		}
	}

	return dbTx.Commit()
}

func (s *PostgresStore) InsertTokenEventBatch(ctx context.Context, events []TokenEvent) error {
	if len(events) == 0 {
		return nil
	}
	dbTx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer dbTx.Rollback()

	stmt, err := dbTx.PrepareContext(ctx, `
		INSERT INTO token_events (
			event_type, event_type_name,
			from_address, from_muxed, to_address, to_muxed, to_muxed_id,
			asset_type, asset_code, asset_issuer, asset_contract_id,
			amount, amount_formatted,
			transaction_hash, ledger_sequence, operation_index, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, e := range events {
		_, err := stmt.ExecContext(ctx,
			e.EventType, e.EventTypeName,
			e.FromAddress, e.FromMuxed, e.ToAddress, e.ToMuxed, e.ToMuxedID,
			e.AssetType, e.AssetCode, e.AssetIssuer, e.AssetContractID,
			e.Amount, e.AmountFormatted,
			e.TransactionHash, e.LedgerSequence, e.OperationIndex, e.CreatedAt)
		if err != nil {
			return err
		}
	}

	return dbTx.Commit()
}

// GetLastIngestedLedger returns the last processed ledger sequence.
func (s *PostgresStore) GetLastIngestedLedger(ctx context.Context) (uint32, error) {
	var seq uint32
	err := s.db.QueryRowContext(ctx,
		"SELECT COALESCE(value::int, 0) FROM ingestion_state WHERE key = 'last_ingested_ledger'").
		Scan(&seq)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return seq, err
}

// SetLastIngestedLedger updates the ingestion cursor (only advances forward).
func (s *PostgresStore) SetLastIngestedLedger(ctx context.Context, seq uint32) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO ingestion_state (key, value, updated_at)
		VALUES ('last_ingested_ledger', $1, NOW())
		ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
		WHERE ingestion_state.value::bigint < $1::bigint`,
		fmt.Sprintf("%d", seq))
	return err
}

// CleanupTestData removes data for a specific ledger sequence (used by tests).
func (s *PostgresStore) CleanupTestData(ctx context.Context, sequence uint32) {
	_, _ = s.db.ExecContext(ctx, "DELETE FROM operations WHERE transaction_hash IN (SELECT hash FROM transactions WHERE ledger_sequence = $1)", sequence)
	_, _ = s.db.ExecContext(ctx, "DELETE FROM transactions WHERE ledger_sequence = $1", sequence)
	_, _ = s.db.ExecContext(ctx, "DELETE FROM ledgers WHERE sequence = $1", sequence)
}

// QueryRow executes a query that returns at most one row, exposing the
// underlying *sql.DB.QueryRowContext for ad-hoc queries (e.g. in tests).
func (s *PostgresStore) QueryRow(ctx context.Context, query string, args ...interface{}) *sql.Row {
	return s.db.QueryRowContext(ctx, query, args...)
}

func (s *PostgresStore) Close() error {
	return s.db.Close()
}
