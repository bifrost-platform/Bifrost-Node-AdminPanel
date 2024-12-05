# Admin Panel for Bifrost Node Staking

An administrative interface for institutions and external wallet users to stake (self-bond) BFC to Biforst Nodes. 

## Features

- Support MetaMask wallet (w/ HW Wallet) 
- Support Bifrost Mainnet and Testnet Networks
- Provide adaptive user actions based on the users' current staking status
- Manage BFC staked in Bifrost Node

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
3. Check your staking status
4. Enter bonding details:
   - Controller address
   - Relayer address
   - Amount to bond
5. Submit the transaction and wait for confirmation
