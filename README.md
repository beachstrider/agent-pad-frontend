# Pump Fun UI

![image](https://github.com/user-attachments/assets/6aa339c2-03fb-4c98-b168-d72e01d72c0e)

Pump Fun UI is a Next.js-based web application for interacting with the Pump Fun platform.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Architecture Overview](#architecture-overview)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Dependencies](#dependencies)


## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- Yarn package manager

### Installation

 Install dependencies:
   ```bash
   yarn install or npm install
   ```

### Running the Application

1. Set up your environment variables (see [Environment Variables](#environment-variables) section).

2. Start the development server:
   ```bash
   yarn dev
   ```

3. Open your browser and navigate to `http://localhost:3000`.

## Architecture Overview

Pump Fun UI is built using the following technologies and frameworks:

- Next.js: React framework for server-side rendering and static site generation
- React: JavaScript library for building user interfaces
- Tailwind CSS: Utility-first CSS framework for styling
- Ethers.js: Library for interacting with Ethereum
- RainbowKit: Ethereum wallet connection library
- Wagmi: React hooks for EVM chains
- lightweight-charts: Charting libraries for data visualization

The application follows a component-based architecture, with reusable UI components and hooks for managing state and interactions with the blockchain.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_BASE_URL=backend-url
NEXT_PUBLIC_BONDING_CURVE_MANAGER_ADDRESS="contract-address"
NEXT_PUBLIC_WS_BASE_URL=https://backend-url
CHAINSAFE_API_KEY=your_chainsafe_api_key
CHAINSAFE_BUCKET_ID=your_chainsafe_bucket_id
NEXT_PUBLIC_DOMAIN=your_domain
NEXT_PUBLIC_BLOCKSCOUT_URL=blockscout-url
NEXT_PUBLIC_DEX_TARGET=max_flr_pool_balance_when_reach_token_will_be_added_to_dex
NEXT_PUBLIC_ETHERSCAN_URL=etherscan-url/routerscan or any explorer url - can be blockscout-url
```
