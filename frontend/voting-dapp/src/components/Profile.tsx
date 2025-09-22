import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import idl from '../idl/voting_dapp.json';
import './Profile.css';

const PROGRAM_ID = new PublicKey('8LT6EPCP5UtZaMQsT1LrM1fiJZgXZebcxRkjf3ZQmGch');

interface Poll {
  id: number;
  description: string;
  yesVotes: number;
  noVotes: number;
  createdAt: number;
  isActive: boolean;
}

const Profile: React.FC = () => {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  const getProvider = useCallback(() => {
    if (!window.solana) return null;
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
    return new AnchorProvider(connection, window.solana as any, {});
  }, []);

  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program(idl as any, provider);
  }, [getProvider]);

  const fetchUserPolls = useCallback(async () => {
    if (!wallet) return;
    
    try {
      const program = getProgram();
      if (!program) return;

      // Fetch all polls
      const pollAccounts = await (program.account as any).poll.all();
      
      // Filter polls by creator
      const userPolls = pollAccounts
        .filter((p: any) => p.account.creator.toString() === wallet)
        .map((p: any) => ({
          id: p.account.id.toNumber(),
          description: p.account.description,
          yesVotes: p.account.yesVotes.toNumber(),
          noVotes: p.account.noVotes.toNumber(),
          createdAt: p.account.createdAt.toNumber(),
          isActive: p.account.isActive,
        }))
        .sort((a: Poll, b: Poll) => b.id - a.id); // Sort by newest first

      setPolls(userPolls);
      setPollCount(userPolls.length);
    } catch (error) {
      console.error('Error fetching user polls:', error);
    } finally {
      setLoading(false);
    }
  }, [wallet, getProgram]);

  useEffect(() => {
    fetchUserPolls();
  }, [fetchUserPolls]);

  if (loading) {
    return (
      <div className="profile">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  const walletDisplay = wallet ? `${wallet.slice(0, 8)}...${wallet.slice(-8)}` : 'Unknown';

  return (
    <div className="profile">
              <div className="profile-header">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back to SolPoll.fun
          </button>
          <h1>👤 SolPoll.fun Profile</h1>
        </div>

      <div className="profile-info">
        <div className="wallet-info">
          <h2>Wallet Address</h2>
          <p className="wallet-address">{walletDisplay}</p>
        </div>
        
        <div className="stats-info">
          <h3>Statistics</h3>
          <div className="stat-item">
            <span className="stat-label">Total Polls Created:</span>
            <span className="stat-value">{pollCount}</span>
          </div>
        </div>
      </div>

      <div className="user-polls">
        <h3>Polls Created by This User</h3>
        
        {polls.length === 0 ? (
          <div className="no-polls">
            <p>This user hasn't created any polls yet.</p>
          </div>
        ) : (
          <div className="polls-grid">
            {polls.map((poll) => (
              <div key={poll.id} className="poll-card">
                <div className="poll-header">
                  <h4>Poll #{poll.id}</h4>
                  <span className={`status ${poll.isActive ? 'active' : 'closed'}`}>
                    {poll.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>
                
                <div className="poll-description">
                  {poll.description}
                </div>
                
                <div className="poll-stats">
                  <div className="vote-count">
                    <span>Yes: {poll.yesVotes}</span>
                    <span>No: {poll.noVotes}</span>
                  </div>
                  <div className="total-votes">
                    Total: {poll.yesVotes + poll.noVotes}
                  </div>
                  
                  {/* Progress Bar for Yes/No Votes */}
                  {poll.yesVotes > 0 || poll.noVotes > 0 ? (
                    <div className="vote-percentages">
                      <div className="percentage-bar">
                        <div 
                          className="yes-bar" 
                          style={{ 
                            width: `${poll.yesVotes + poll.noVotes > 0 ? 
                              Math.round((poll.yesVotes / (poll.yesVotes + poll.noVotes)) * 100) : 0}%` 
                          }}
                        >
                          {poll.yesVotes + poll.noVotes > 0 ? 
                            Math.round((poll.yesVotes / (poll.yesVotes + poll.noVotes)) * 100) : 0}%
                        </div>
                        <div 
                          className="no-bar" 
                          style={{ 
                            width: `${poll.yesVotes + poll.noVotes > 0 ? 
                              Math.round((poll.noVotes / (poll.yesVotes + poll.noVotes)) * 100) : 0}%` 
                          }}
                        >
                          {poll.yesVotes + poll.noVotes > 0 ? 
                            Math.round((poll.noVotes / (poll.yesVotes + poll.noVotes)) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-votes-yet">
                      <small>No votes yet</small>
                    </div>
                  )}
                </div>
                
                <div className="poll-meta">
                  <small>Created: {new Date(poll.createdAt * 1000).toLocaleString()}</small>
                </div>
                
                <button 
                  className="view-poll-btn"
                  onClick={() => navigate(`/poll/${poll.id}`)}
                >
                  View Poll
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {connected && publicKey && publicKey.toString() === wallet && (
        <div className="profile-actions">
          <button onClick={() => navigate('/')} className="create-poll-btn">
            Create New Poll
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
