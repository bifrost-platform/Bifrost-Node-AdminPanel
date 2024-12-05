# Admin Panel DApp

A decentralized application for interacting with the Bifrost Network’s bonding contract. This DApp allows node operators to connect their MetaMask wallet, bond BFC, and manage their candidate status on the Bifrost Network. It supports EVM transactions to perform bonding functionality on the Bifrost Network, enabling node operators who use hardware wallets to perform self-bonding.

## Features

- Check the status of candidate validation
- Self-bonding by using Bifrost Network's precompile
- Additional bond amount management

## Prerequisites

- Node.js (>= 14.15.0)
- MetaMask browser extension
- Access to Bifrost Testnet & Mainnet

## Installation


1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```


The application will be available at `http://localhost:3000`

## Network Configuration

Bifrost Testnet details:
- Chain ID: 0xBFC0
- Network Name: Bifrost Testnet
- RPC URL: https://public-01.testnet.bifrostnetwork.com/rpc
- Currency Symbol: BFC
- Explorer: https://explorer.testnet.bifrostnetwork.com/

Bifrost Mainnet details:
- Chain ID: 0xBFC
- Network Name: Bifrost Mainnet
- RPC URL: https://public-01.mainnet.bifrostnetwork.com/rpc
- Currency Symbol: BFC
- Explorer: https://explorer.mainnet.bifrostnetwork.com/

## Usage

1. Connect your MetaMask wallet
2. Add or switch to Bifrost Mainnet or Testnet
3. Check the status of your candidate validation
4. Enter bonding details:
   - Controller address
   - Relayer address
   - Amount to bond
5. Submit transaction and wait for confirmation
