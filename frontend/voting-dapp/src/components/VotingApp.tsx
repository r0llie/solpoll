import React, { useCallback, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import idl from '../idl/voting_dapp.json';
import './VotingApp.css';

interface Poll {
  id: BN;
  description: string;
  creator: PublicKey;
  yesVotes: BN;
  noVotes: BN;
  createdAt: BN;
  isActive: boolean;
}

const PROGRAM_ID = new PublicKey('AqVFH6Vq5whfoYGWKtViGpd2oHCNCHi4nc7F8RDNFHxx');

const VotingApp: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<{ publicKey: PublicKey; account: Poll }[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPollDescription, setNewPollDescription] = useState('');
  const [nextPollId, setNextPollId] = useState(1);

  const getProvider = () => {
    if (!wallet) {
      console.log('No wallet available');
      return null;
    }
    console.log('Creating provider with wallet:', wallet.publicKey?.toString());
    return new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions());
  };

  const getProgram = () => {
    const provider = getProvider();
    if (!provider) {
      console.log('No provider available');
      return null;
    }
    console.log('Creating program with provider');
    return new Program(idl as any, provider);
  };

  const fetchPolls = useCallback(async () => {
    try {
      console.log('Fetching polls...');
      const program = getProgram();
      if (!program) {
        console.log('No program available');
        return;
      }

      console.log('Program available, fetching poll accounts...');
      const pollAccounts = await (program.account as any).poll.all();
      console.log('Poll accounts fetched:', pollAccounts);
      setPolls(pollAccounts as { publicKey: PublicKey; account: Poll }[]);
      
      // Update next poll ID
      if (pollAccounts.length > 0) {
        const validPolls = pollAccounts.filter((poll: any) => poll?.account?.id);
        if (validPolls.length > 0) {
          const maxId = Math.max(...validPolls.map((poll: any) => poll.account.id.toNumber()));
          setNextPollId(maxId + 1);
        }
      }
      
      console.log('Polls set, total count:', pollAccounts.length);
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  }, [connection, wallet]);

  useEffect(() => {
    if (wallet.connected) {
      fetchPolls();
    }
  }, [wallet.connected, fetchPolls]);

  const createPoll = async () => {
    if (!newPollDescription.trim()) {
      alert('Please enter a poll description');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating poll...');
      const program = getProgram();
      if (!program || !wallet.publicKey) {
        console.log('No program or wallet available');
        return;
      }

      const pollId = new BN(nextPollId);
      console.log('Creating poll with ID:', nextPollId);
      const [pollPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('poll'), pollId.toArrayLike(Buffer, 'le', 8)],
        PROGRAM_ID
      );
      console.log('Poll PDA:', pollPda.toString());

      const tx = await program.methods
        .createPoll(pollId, newPollDescription)
        .accounts({
          poll: pollPda,
          creator: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log('Poll created with transaction:', tx);

      setNewPollDescription('');
      setNextPollId(nextPollId + 1);
      await fetchPolls();
      alert('Poll created successfully!');
    } catch (error: any) {
      console.error('Error creating poll:', error);
      alert(`Error creating poll: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (pollPubkey: PublicKey, option: boolean) => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program || !wallet.publicKey) return;

      const [votePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vote'), pollPubkey.toBuffer(), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );

      await program.methods
        .vote(option)
        .accounts({
          poll: pollPubkey,
          voteAccount: votePda,
          voter: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      await fetchPolls();
      alert(`Vote cast: ${option ? 'YES' : 'NO'}`);
    } catch (error: any) {
      console.error('Error voting:', error);
      if (error?.message?.includes('already in use')) {
        alert('You have already voted on this poll');
      } else {
        alert('Error casting vote');
      }
    } finally {
      setLoading(false);
    }
  };

  const closePoll = async (pollPubkey: PublicKey) => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program || !wallet.publicKey) return;

      await program.methods
        .closePoll()
        .accounts({
          poll: pollPubkey,
          creator: wallet.publicKey,
        })
        .rpc();

      await fetchPolls();
      alert('Poll closed successfully!');
    } catch (error) {
      console.error('Error closing poll:', error);
      alert('Error closing poll');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="voting-app">
        <header className="header">
          <h1>🗳️ SolPoll.fun</h1>
          <div className="header-actions">
            {wallet.connected && wallet.publicKey && (
              <button 
                className="profile-btn"
                onClick={() => navigate(`/profile/${wallet.publicKey!.toString()}`)}
              >
                👤 My Profile
              </button>
            )}
            <WalletMultiButton />
          </div>
        </header>
        <main className="main">
          <div className="connect-wallet">
            <h2>Welcome to Solana Voting</h2>
            <p>Connect your wallet to create polls and vote!</p>
            <WalletMultiButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="voting-app">
      <header className="header">
        <h1>🗳️ SolPoll.fun</h1>
        <div className="header-actions">
          {wallet.connected && wallet.publicKey && (
            <button 
              className="profile-btn"
              onClick={() => navigate(`/profile/${wallet.publicKey!.toString()}`)}
            >
              👤 My Profile
            </button>
          )}
          <WalletMultiButton />
        </div>
      </header>

      <main className="main">
        <section className="create-poll-section">
          <h2>🗳️ Create New Poll on SolPoll.fun</h2>
          <div className="create-poll-form">
            <input
              type="text"
              placeholder="Enter your poll question..."
              value={newPollDescription}
              onChange={(e) => setNewPollDescription(e.target.value)}
              disabled={loading}
            />
            <button onClick={createPoll} disabled={loading || !newPollDescription.trim()}>
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </section>

        <section className="polls-section">
          <h2>Active Polls ({polls.length})</h2>
          {polls.length === 0 ? (
            <p className="no-polls">No polls found. Create the first one!</p>
          ) : (
            <div className="polls-section">
              <h2>📊 Recent Polls on SolPoll.fun</h2>
              

              
              <div className="polls-grid">
                {polls
                  .filter((poll) => poll?.publicKey && poll?.account && poll?.account?.id)
                  .slice(0, 5) // Show only last 5 polls
                  .map(({ publicKey, account }) => (
                  <div key={publicKey.toString()} className="poll-card">
                  <div className="poll-header">
                    <h3 
                      className="poll-title"
                      onClick={() => navigate(`/poll/${account.id.toString()}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      Poll #{account.id.toString()}
                    </h3>
                    <span className={`status ${account.isActive ? 'active' : 'closed'}`}>
                      {account.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  
                  <p className="poll-description">{account.description}</p>
                  
                  <div className="poll-stats">
                    <div className="vote-count">
                      <span className="yes-votes">👍 YES: {account.yesVotes?.toString() || '0'}</span>
                      <span className="no-votes">👎 NO: {account.noVotes?.toString() || '0'}</span>
                    </div>
                    <div className="total-votes">
                      Total Votes: {account.yesVotes && account.noVotes ? account.yesVotes.add(account.noVotes).toString() : '0'}
                    </div>
                    
                    {/* Progress Bar for Yes/No Votes */}
                    {account.yesVotes && account.noVotes && (account.yesVotes.toNumber() > 0 || account.noVotes.toNumber() > 0) && (
                      <div className="vote-percentages">
                        <div className="percentage-bar">
                          <div 
                            className="yes-bar" 
                            style={{ 
                              width: `${account.yesVotes.toNumber() + account.noVotes.toNumber() > 0 ? 
                                Math.round((account.yesVotes.toNumber() / (account.yesVotes.toNumber() + account.noVotes.toNumber())) * 100) : 0}%` 
                            }}
                          >
                            {account.yesVotes.toNumber() + account.noVotes.toNumber() > 0 ? 
                              Math.round((account.yesVotes.toNumber() / (account.yesVotes.toNumber() + account.noVotes.toNumber())) * 100) : 0}%
                          </div>
                          <div 
                            className="no-bar" 
                            style={{ 
                              width: `${account.yesVotes.toNumber() + account.noVotes.toNumber() > 0 ? 
                                Math.round((account.noVotes.toNumber() / (account.yesVotes.toNumber() + account.noVotes.toNumber())) * 100) : 0}%` 
                            }}
                          >
                            {account.yesVotes.toNumber() + account.noVotes.toNumber() > 0 ? 
                              Math.round((account.noVotes.toNumber() / (account.yesVotes.toNumber() + account.noVotes.toNumber())) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="poll-actions">
                    {account.isActive ? (
                      <div className="vote-buttons">
                        <button
                          className="vote-btn yes-btn"
                          onClick={() => vote(publicKey, true)}
                          disabled={loading}
                        >
                          Vote YES 👍
                        </button>
                        <button
                          className="vote-btn no-btn"
                          onClick={() => vote(publicKey, false)}
                          disabled={loading}
                        >
                          Vote NO 👎
                        </button>
                      </div>
                    ) : (
                      <p className="poll-closed">This poll is closed</p>
                    )}
                    
                                      {account.creator && wallet.publicKey && account.creator.equals(wallet.publicKey) && account.isActive && (
                    <button
                      className="close-btn"
                      onClick={() => closePoll(publicKey)}
                      disabled={loading}
                    >
                      Close Poll
                    </button>
                  )}
                  </div>

                  <div className="poll-meta">
                    <small>
                      Created by: {account.creator ? `${account.creator.toString().slice(0, 8)}...${account.creator.toString().slice(-8)}` : 'Unknown'}
                    </small>
                  </div>
                                  </div>
                ))}
              </div>
              
              {polls.length > 5 && (
                <div className="view-all-polls">
                  <button 
                    className="view-all-btn"
                    onClick={() => navigate('/polls')}
                  >
                    View All Polls
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Built on Solana Devnet | School of Solana Final Project</p>
      </footer>
    </div>
  );
};

export default VotingApp;
