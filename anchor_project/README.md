# VoteChain Solana Program

A decentralized voting application built on Solana using the Anchor framework.

## Program Overview

The VoteChain program enables users to create and participate in yes/no polls on the Solana blockchain. It uses Program Derived Addresses (PDAs) for deterministic account creation and implements secure voting mechanisms.

## Architecture

### Account Types

- **Poll**: Stores poll information and vote counts
- **VoteAccount**: Records individual votes to prevent double voting

### Instructions

- **create_poll**: Creates a new poll with unique ID
- **vote**: Casts a vote (YES/NO) on an active poll
- **close_poll**: Closes a poll (creator only)

### PDA Usage

- **Poll PDA**: `["poll", poll_id.to_le_bytes()]`
- **Vote PDA**: `["vote", poll_pubkey, voter_pubkey]`

## Development

### Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor CLI 0.28+
- Node.js 16+

### Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Build the program:
   ```bash
   anchor build
   ```

3. Deploy to Devnet:
   ```bash
   anchor deploy --provider.cluster devnet
   ```

### Testing

Run the comprehensive test suite:

```bash
anchor test
```

Tests cover:
- ✅ Happy path scenarios
- ✅ Error conditions
- ✅ Access control
- ✅ Business logic validation

## Configuration

- **Cluster**: Solana Devnet
- **Program ID**: `BE82CfBvpmk4CvN7QRWiVEDrZ5HKF2vw7duGvTQgLn5d`

## TODO

- [x] ✅ Core program logic implementation
- [x] ✅ PDA derivation for accounts
- [x] ✅ Poll creation and management
- [x] ✅ Voting mechanism with double-vote prevention
- [x] ✅ Access control for poll closing
- [x] ✅ Comprehensive test coverage
- [x] ✅ Devnet deployment
- [x] ✅ Error handling and validation
- [ ] 🔄 Mainnet deployment
- [ ] 🔄 Additional voting options (multiple choice)
- [ ] 🔄 Time-based poll constraints
- [ ] 🔄 Governance features integration