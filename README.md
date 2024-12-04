# Bifrost Bonding DApp

A decentralized application for interacting with Bifrost Network's bonding functionality. This DApp allows users to connect their MetaMask wallet, bond BFC, and manage their candidate status on the Bifrost.

## Features

- MetaMask wallet integration
- Network management (add/switch to Bifrost)
- Candidate validation status check
- Token bonding functionality
- Additional bond amount management

## Prerequisites

- Node.js (>= 14.15.0)
- MetaMask browser extension
- Access to Bifrost Testnet

## Installation


1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

3. Start the server:

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

## Usage

1. Connect your MetaMask wallet
2. Add or switch to Bifrost Testnet
3. Check your candidate validation status
4. Enter bonding details:
   - Controller address
   - Relayer address
   - Amount to bond
5. Submit transaction and wait for confirmation