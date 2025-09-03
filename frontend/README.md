# VoteChain Frontend

A React-based frontend for the VoteChain decentralized voting application built on Solana.

## Features

- **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **Poll Creation**: Create new yes/no polls with custom descriptions
- **Voting Interface**: Cast votes on active polls
- **Real-time Results**: View live vote counts and poll statistics
- **Windows 98 Theme**: Nostalgic retro interface design
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Solana Wallet Adapters** for wallet integration
- **Anchor Framework** for Solana program interaction
- **CSS3** with Windows 98 styling

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend/voting-dapp
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Create Poll**: Enter your question and click "Create Poll"
3. **Vote**: Browse active polls and cast your vote (YES/NO)
4. **View Results**: See real-time vote counts and statistics
5. **Manage**: Close polls you created when finished

## Configuration

The frontend is configured to connect to:
- **Network**: Solana Devnet
- **Program ID**: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`

## Deployment

The frontend can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## TODO

- [x] ✅ Wallet integration with Solana
- [x] ✅ Poll creation and management
- [x] ✅ Voting interface
- [x] ✅ Real-time data fetching
- [x] ✅ Windows 98 theme styling
- [x] ✅ Responsive design
- [x] ✅ Error handling
- [ ] 🔄 Deploy to production hosting
- [ ] 🔄 Add analytics tracking
- [ ] 🔄 Implement caching strategies
- [ ] 🔄 Add unit tests for components