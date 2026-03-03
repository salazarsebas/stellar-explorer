package source

import (
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"

	"github.com/stellar/go-stellar-sdk/ingest"
	"github.com/stellar/go-stellar-sdk/support/datastore"
	"github.com/stellar/go-stellar-sdk/xdr"
)

func PubnetDataLakeConfig() datastore.DataStoreConfig {
	return datastore.DataStoreConfig{
		Type: "S3",
		Params: map[string]string{
			"destination_bucket_path": "aws-public-blockchain/v1.1/stellar/ledgers/pubnet",
			"region":                  "us-east-2",
		},
		Schema: datastore.DataStoreSchema{
			LedgersPerFile:    1,
			FilesPerPartition: 64000,
		},
	}
}

func PubnetPublisherConfig() ingest.PublisherConfig {
	return ingest.PublisherConfig{
		DataStoreConfig:       PubnetDataLakeConfig(),
		BufferedStorageConfig: ingest.DefaultBufferedStorageBackendConfig(1),
	}
}

func LedgerEntryFromCloseMeta(lcm xdr.LedgerCloseMeta) (LedgerEntry, error) {
	headerEntry := lcm.LedgerHeaderHistoryEntry()
	header := headerEntry.Header

	headerBytes, err := headerEntry.MarshalBinary()
	if err != nil {
		return LedgerEntry{}, fmt.Errorf("marshal header entry: %w", err)
	}
	headerXDR := base64.StdEncoding.EncodeToString(headerBytes)

	hash := hex.EncodeToString(headerEntry.Hash[:])
	closeTime := fmt.Sprintf("%d", header.ScpValue.CloseTime)

	return LedgerEntry{
		Hash:            hash,
		Sequence:        uint32(header.LedgerSeq),
		LedgerCloseTime: closeTime,
		HeaderXDR:       headerXDR,
	}, nil
}

func TransactionEntriesFromCloseMeta(lcm xdr.LedgerCloseMeta, networkPassphrase string) ([]TransactionEntry, error) {
	reader, err := ingest.NewLedgerTransactionReaderFromLedgerCloseMeta(networkPassphrase, lcm)
	if err != nil {
		return nil, fmt.Errorf("create tx reader: %w", err)
	}

	header := lcm.LedgerHeaderHistoryEntry().Header
	closeTime := int64(header.ScpValue.CloseTime)
	ledgerSeq := uint32(header.LedgerSeq)

	var entries []TransactionEntry
	for {
		tx, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("read transaction: %w", err)
		}

		envBytes, err := tx.Envelope.MarshalBinary()
		if err != nil {
			return nil, fmt.Errorf("marshal envelope: %w", err)
		}
		envelopeXDR := base64.StdEncoding.EncodeToString(envBytes)

		resultBytes, err := tx.Result.Result.MarshalBinary()
		if err != nil {
			return nil, fmt.Errorf("marshal result: %w", err)
		}
		resultXDR := base64.StdEncoding.EncodeToString(resultBytes)

		metaBytes, err := tx.UnsafeMeta.MarshalBinary()
		if err != nil {
			return nil, fmt.Errorf("marshal result meta: %w", err)
		}
		resultMetaXDR := base64.StdEncoding.EncodeToString(metaBytes)

		var diagEvents []string
		if events, evErr := tx.GetDiagnosticEvents(); evErr == nil {
			for _, ev := range events {
				evBytes, marshalErr := ev.MarshalBinary()
				if marshalErr == nil {
					diagEvents = append(diagEvents, base64.StdEncoding.EncodeToString(evBytes))
				}
			}
		}

		status := "FAILED"
		if tx.Successful() {
			status = "SUCCESS"
		}

		feeBump := tx.Envelope.Type == xdr.EnvelopeTypeEnvelopeTypeTxFeeBump

		entries = append(entries, TransactionEntry{
			Status:              status,
			ApplicationOrder:    int32(tx.Index),
			FeeBump:             feeBump,
			EnvelopeXDR:         envelopeXDR,
			ResultXDR:           resultXDR,
			ResultMetaXDR:       resultMetaXDR,
			DiagnosticEventsXDR: diagEvents,
			Ledger:              ledgerSeq,
			CreatedAt:           closeTime,
		})
	}

	return entries, nil
}
