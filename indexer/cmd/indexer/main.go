package main

import (
	"fmt"
	"log"
	"os"

	"github.com/miguelnietoa/stellar-explorer/indexer/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	fmt.Printf("Stellar Explorer Indexer\n")
	fmt.Printf("  Network:    %s\n", cfg.Network)
	fmt.Printf("  RPC:        %s\n", cfg.RPCEndpoint)
	fmt.Printf("  Database:   %s\n", cfg.DatabaseURL)
	fmt.Printf("  Workers:    %d\n", cfg.WorkerCount)

	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "live":
			fmt.Println("Starting live ingestion...")
			// TODO: implement
		case "backfill":
			fmt.Println("Starting historical backfill...")
			// TODO: implement
		case "migrate":
			fmt.Println("Running migrations...")
			// TODO: implement
		default:
			log.Fatalf("Unknown command: %s. Use: live, backfill, migrate", os.Args[1])
		}
	} else {
		fmt.Println("Usage: indexer <live|backfill|migrate>")
	}
}
