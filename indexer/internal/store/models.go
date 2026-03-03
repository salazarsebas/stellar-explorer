package store

import "time"

// Ledger represents a row in the ledgers hypertable.
type Ledger struct {
	Sequence            uint32    `db:"sequence"`
	Hash                string    `db:"hash"`
	PrevHash            string    `db:"prev_hash"`
	ClosedAt            time.Time `db:"closed_at"`
	TotalCoins          int64     `db:"total_coins"`
	FeePool             int64     `db:"fee_pool"`
	BaseFee             int32     `db:"base_fee"`
	BaseReserve         int32     `db:"base_reserve"`
	MaxTxSetSize        int32     `db:"max_tx_set_size"`
	ProtocolVersion     int32     `db:"protocol_version"`
	TransactionCount    int32     `db:"transaction_count"`
	OperationCount      int32     `db:"operation_count"`
	SuccessfulTxCount   int32     `db:"successful_tx_count"`
	FailedTxCount       int32     `db:"failed_tx_count"`
	TxSetOperationCount *int32    `db:"tx_set_operation_count"`
	HeaderXDR           *string   `db:"header_xdr"`
}

// Transaction represents a row in the transactions hypertable.
type Transaction struct {
	Hash             string    `db:"hash"`
	LedgerSequence   uint32    `db:"ledger_sequence"`
	ApplicationOrder int32     `db:"application_order"`
	Account          string    `db:"account"`
	AccountMuxed     *string   `db:"account_muxed"`
	AccountSequence  int64     `db:"account_sequence"`
	FeeCharged       int64     `db:"fee_charged"`
	MaxFee           int64     `db:"max_fee"`
	OperationCount   int32     `db:"operation_count"`
	MemoType         int16     `db:"memo_type"`
	MemoText         *string   `db:"memo_text"`
	MemoHash         *string   `db:"memo_hash"`
	Status           int16     `db:"status"`
	IsSoroban        bool      `db:"is_soroban"`
	SorobanResources *string   `db:"soroban_resources"` // JSON
	EnvelopeXDR      string    `db:"envelope_xdr"`
	ResultXDR        string    `db:"result_xdr"`
	ResultMetaXDR    *string   `db:"result_meta_xdr"`
	FeeMetaXDR       *string   `db:"fee_meta_xdr"`
	CreatedAt        time.Time `db:"created_at"`
}

// Operation represents a row in the operations hypertable.
type Operation struct {
	TransactionID    int64     `db:"transaction_id"`
	TransactionHash  string    `db:"transaction_hash"`
	ApplicationOrder int32     `db:"application_order"`
	Type             int16     `db:"type"`
	TypeName         string    `db:"type_name"`
	SourceAccount    *string   `db:"source_account"`
	AssetCode        *string   `db:"asset_code"`
	AssetIssuer      *string   `db:"asset_issuer"`
	Amount           *string   `db:"amount"`
	Destination      *string   `db:"destination"`
	ContractID       *string   `db:"contract_id"`
	FunctionName     *string   `db:"function_name"`
	Details          string    `db:"details"` // JSON
	CreatedAt        time.Time `db:"created_at"`
}

// Effect represents a row in the effects hypertable.
type Effect struct {
	OperationID     int64     `db:"operation_id"`
	TransactionHash string    `db:"transaction_hash"`
	Type            int16     `db:"type"`
	TypeName        string    `db:"type_name"`
	Account         string    `db:"account"`
	Details         string    `db:"details"` // JSON
	CreatedAt       time.Time `db:"created_at"`
}
