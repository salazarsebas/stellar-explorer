FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /indexer ./cmd/indexer

FROM alpine:3.21
RUN apk --no-cache add ca-certificates
COPY --from=builder /indexer /usr/local/bin/indexer
ENTRYPOINT ["indexer"]
