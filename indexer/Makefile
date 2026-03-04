.PHONY: build test lint fmt run-live run-backfill clean

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

clean:
	rm -rf bin/
