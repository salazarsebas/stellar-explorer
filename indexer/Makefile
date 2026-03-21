.PHONY: build test lint fmt run-live run-backfill migrate clean

build:
	go build -o bin/indexer ./cmd/indexer

test:
	go test ./... -v

fmt:
	gofmt -w .

lint:
	go vet ./...

run-live: build
	./bin/indexer live

run-backfill: build
	./bin/indexer backfill

migrate: build
	./bin/indexer migrate

clean:
	rm -rf bin/
