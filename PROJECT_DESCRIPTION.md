# Project Description

**Deployed Frontend URL:** [Will be deployed to Vercel]

**Solana Program ID:** `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`

## Project Overview

### Description
A decentralized voting application built on Solana that allows users to create polls and vote on them. The dApp demonstrates core Solana development concepts including PDA usage, account management, and secure voting mechanisms. Users can create yes/no polls, cast votes, and view real-time results. Poll creators can close their polls when needed. The application ensures one vote per wallet per poll and maintains transparent vote counts.

### Key Features
- **Create Polls**: Users can create yes/no polls with custom descriptions
- **Vote on Polls**: Cast votes (YES or NO) on active polls with one vote per wallet restriction
- **Real-time Results**: View live vote counts and poll statistics
- **Poll Management**: Poll creators can close their polls
- **Wallet Integration**: Seamless integration with Phantom and Solflare wallets
- **Responsive Design**: Windows 98 themed interface for nostalgic user experience
  
### How to Use the dApp
1. **Connect Wallet** - Click "Connect Wallet" and approve connection with Phantom or Solflare
2. **Create a Poll** - Enter your poll question in the "Create New Poll" section and click "Create Poll"
3. **Vote on Polls** - Browse active polls and click "Vote YES 👍" or "Vote NO 👎" to cast your vote
4. **View Results** - See real-time vote counts and total votes for each poll
5. **Manage Polls** - If you created a poll, you can close it using the "Close Poll" button

## Program Architecture
The Voting dApp uses a clean architecture with two main account types (Poll and VoteAccount) and three core instructions. The program leverages PDAs for deterministic addressing and implements proper access control to ensure security.

### PDA Usage
The program uses Program Derived Addresses to create deterministic, collision-free accounts for polls and votes.

**PDAs Used:**
- **Poll PDA**: Derived from seeds `["poll", poll_id.to_le_bytes()]` - ensures each poll has a unique, deterministic address based on its ID
- **Vote PDA**: Derived from seeds `["vote", poll_pubkey, voter_pubkey]` - ensures each voter can only vote once per poll and creates a unique vote record

### Program Instructions
**Instructions Implemented:**
- **create_poll**: Creates a new poll with a unique ID and description, initializes vote counts to zero
- **vote**: Allows users to cast a vote (true for YES, false for NO) on an active poll, updates poll vote counts
- **close_poll**: Allows poll creators to deactivate their polls, preventing further voting

### Account Structure
```rust
#[account]
pub struct Poll {
    pub id: u64,              // Unique poll identifier
    pub description: String,   // Poll question/description
    pub creator: Pubkey,      // Wallet that created the poll
    pub yes_votes: u64,       // Count of YES votes
    pub no_votes: u64,        // Count of NO votes
    pub created_at: i64,      // Unix timestamp of creation
    pub is_active: bool,      // Whether poll accepts votes
}

#[account]
pub struct VoteAccount {
    pub poll: Pubkey,         // Reference to the poll
    pub voter: Pubkey,        // Wallet that cast the vote
    pub option: bool,         // Vote choice (true=YES, false=NO)
}
```

## Testing

### Test Coverage
Comprehensive test suite covering all program instructions with both successful operations and error conditions to ensure program security and reliability.

**Happy Path Tests:**
- **Create Poll**: Successfully creates a new poll with correct initial values (ID, description, vote counts)
- **Vote YES**: Properly casts a YES vote and updates poll statistics
- **Vote NO**: Properly casts a NO vote and updates poll statistics  
- **Close Poll**: Successfully deactivates a poll when requested by creator

**Unhappy Path Tests:**
- **Duplicate Poll ID**: Fails when trying to create a poll with an existing ID
- **Vote on Inactive Poll**: Prevents voting on closed polls with proper error messaging
- **Double Voting**: Prevents the same wallet from voting twice on the same poll
- **Unauthorized Close**: Prevents non-creators from closing polls they don't own

### Running Tests
```bash
# Navigate to the anchor project
cd anchor_project/voting_dapp

# Install dependencies
yarn install

# Run comprehensive test suite
anchor test
```

### Additional Notes for Evaluators

This is my first complete Solana dApp and represents significant learning progress! Key challenges overcome:

1. **PDA Implementation**: Initially struggled with PDA seed generation but successfully implemented deterministic addressing for polls and votes
2. **Account Constraints**: Learned to properly use Anchor constraints for initialization, access control, and space allocation
3. **Error Handling**: Implemented custom error codes and proper validation for business logic
4. **Frontend Integration**: Successfully connected React frontend to deployed Solana program using Anchor and wallet adapters
5. **Testing Strategy**: Developed comprehensive test coverage including edge cases and error scenarios

The application demonstrates practical understanding of Solana development concepts while providing a real-world use case for decentralized voting. The code is production-ready with proper error handling, security measures, and a polished user interface.