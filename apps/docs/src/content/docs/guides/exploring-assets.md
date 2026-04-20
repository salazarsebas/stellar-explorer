---
title: Exploring Assets
description: How to discover and analyze assets on the Stellar network.
---

Assets on Stellar are identified by a code (e.g., `USDC`) and an issuer account. XLM is the native asset and has no issuer.

## Asset Discovery

The Assets page lists assets available on the network. Each asset card shows:

- **Code and issuer** — The asset identifier
- **Domain** — The issuer's home domain (fetched from their `stellar.toml`)
- **Statistics** — Number of holders, trustlines, and trade volume

## Asset Details

Click any asset to see:

- **Metadata** — Information from the issuer's `stellar.toml` file (name, description, image)
- **Holders** — Accounts holding this asset
- **Trades** — Recent trade history for this asset pair

## TOML Information

Stellar Explorer fetches and displays metadata from the issuer's `stellar.toml` file. This includes the asset's official name, description, logo, and compliance information. The TOML data is fetched through a secure proxy to prevent SSRF attacks.
