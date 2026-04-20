---
title: Switching Networks
description: How to switch between Public, Testnet, and Futurenet.
---

Stellar Explorer supports three networks. The current network is shown in the header and reflected in the URL.

## Available Networks

| Network | Purpose |
|---|---|
| **Public** | The production Stellar network with real assets |
| **Testnet** | A sandbox for development and testing |
| **Futurenet** | An experimental network for upcoming features |

## How to Switch

Click the network selector in the header to switch. The page will reload with data from the selected network.

## URL Structure

The network is embedded in the URL path:

```
/en/public/transactions    → Public network
/en/testnet/transactions   → Testnet
/en/futurenet/transactions → Futurenet
```

Bookmarks and shared links always point to a specific network.
