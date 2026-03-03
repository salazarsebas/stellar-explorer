package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL  string
	RedisURL     string
	TypesenseURL string
	TypesenseKey string
	RPCEndpoint  string
	DataLakePath string
	Network      string // "public", "testnet", "futurenet"
	StartLedger  uint32
	BatchSize    int
	WorkerCount  int
}

func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:  getEnv("DATABASE_URL", "postgresql://explorer:explorer_dev@localhost:54320/stellar_explorer?sslmode=disable"),
		RedisURL:     getEnv("REDIS_URL", "redis://localhost:63790"),
		TypesenseURL: getEnv("TYPESENSE_URL", "http://localhost:18108"),
		TypesenseKey: getEnv("TYPESENSE_KEY", "explorer_dev_key"),
		RPCEndpoint:  getEnv("RPC_ENDPOINT", ""),
		DataLakePath: getEnv("DATA_LAKE_PATH", "s3://aws-public-blockchain/v1.1/stellar/ledgers/pubnet"),
		Network:      getEnv("NETWORK", "public"),
		BatchSize:    getEnvInt("BATCH_SIZE", 100),
		WorkerCount:  getEnvInt("WORKER_COUNT", 8),
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		if n, err := strconv.Atoi(val); err == nil {
			return n
		}
	}
	return fallback
}
