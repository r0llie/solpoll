import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import idl from '../idl/voting_dapp.json';
import './PollDetail.css';

const PROGRAM_ID = new PublicKey('BE82CfBvpmk4CvN7QRWiVEDrZ5HKF2vw7duGvTQgLn5d');

interface Poll {
  id: number;
  description: string;
  creator: PublicKey;
  yesVotes: number;
  noVotes: number;
  createdAt: number;
  isActive: boolean;
}

const PollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

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

  const fetchPoll = useCallback(async () => {
    if (!id) return;
    
    try {
      const program = getProgram();
      if (!program) return;

      // Fetch poll by ID
      const pollAccounts = await (program.account as any).poll.all();
      const foundPoll = pollAccounts.find((p: any) => p.account.id.toString() === id);
      
      if (foundPoll) {
        setPoll({
          id: foundPoll.account.id.toNumber(),
          description: foundPoll.account.description,
          creator: foundPoll.account.creator,
          yesVotes: foundPoll.account.yesVotes.toNumber(),
          noVotes: foundPoll.account.noVotes.toNumber(),
          createdAt: foundPoll.account.createdAt.toNumber(),
          isActive: foundPoll.account.isActive,
        });
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  }, [id, getProgram]);

  const vote = async (option: boolean) => {
    if (!connected || !publicKey || !poll) return;
    
    try {
      setVoting(true);
      const program = getProgram();
      if (!program) return;

      // Create vote account PDA
      const [voteAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vote'),
          new PublicKey(poll.id).toBuffer(),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      // Vote instruction
      await program.methods
        .vote(option)
        .accounts({
          poll: new PublicKey(poll.id),
          voteAccount,
          voter: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      // Refresh poll data
      await fetchPoll();
    } catch (error: any) {
      console.error('Error voting:', error);
      if (error.message?.includes('already in use')) {
        alert('You have already voted on this poll');
      } else {
        alert('Error casting vote');
      }
    } finally {
      setVoting(false);
    }
  };

  const closePoll = async () => {
    if (!connected || !publicKey || !poll) return;
    
    try {
      setVoting(true);
      const program = getProgram();
      if (!program) return;

      // Close poll instruction
      await program.methods
        .closePoll()
        .accounts({
          poll: new PublicKey(poll.id),
          creator: publicKey,
        })
        .rpc();

      // Refresh poll data
      await fetchPoll();
    } catch (error: any) {
      console.error('Error closing poll:', error);
      alert('Error closing poll');
    } finally {
      setVoting(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  if (loading) {
    return (
      <div className="poll-detail">
        <div className="loading">Loading poll...</div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-detail">
        <div className="error">Poll not found</div>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const totalVotes = poll.yesVotes + poll.noVotes;
  const yesPercentage = totalVotes > 0 ? Math.round((poll.yesVotes / totalVotes) * 100) : 0;
  const noPercentage = totalVotes > 0 ? Math.round((poll.noVotes / totalVotes) * 100) : 0;
  const isCreator = connected && publicKey && poll.creator.equals(publicKey);

  return (
    <div className="poll-detail">
      <div className="poll-detail-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to SolPoll.fun
        </button>
        <h1>🗳️ SolPoll.fun - Poll #{poll.id}</h1>
      </div>

      <div className="poll-detail-card">
        <div className="poll-header">
          <h2>{poll.description}</h2>
          <span className={`status ${poll.isActive ? 'active' : 'closed'}`}>
            {poll.isActive ? 'Active' : 'Closed'}
          </span>
        </div>

        <div className="poll-stats">
          <div className="vote-count">
            <span>Yes: {poll.yesVotes}</span>
            <span>No: {poll.noVotes}</span>
          </div>
          <div className="total-votes">Total Votes: {totalVotes}</div>
          
          {totalVotes > 0 && (
            <div className="vote-percentages">
              <div className="percentage-bar">
                <div className="yes-bar" style={{ width: `${yesPercentage}%` }}>
                  {yesPercentage}%
                </div>
                <div className="no-bar" style={{ width: `${noPercentage}%` }}>
                  {noPercentage}%
                </div>
              </div>
            </div>
          )}
        </div>

        {poll.isActive && connected && (
          <div className="poll-actions">
            <div className="vote-buttons">
              <button
                className="vote-btn yes-btn"
                onClick={() => vote(true)}
                disabled={voting}
              >
                Vote YES 👍
              </button>
              <button
                className="vote-btn no-btn"
                onClick={() => vote(false)}
                disabled={voting}
              >
                Vote NO 👎
              </button>
            </div>
          </div>
        )}

        {isCreator && poll.isActive && (
          <button
            className="close-btn"
            onClick={closePoll}
            disabled={voting}
          >
            Close Poll
          </button>
        )}

        <div className="poll-meta">
          <small>Created: {new Date(poll.createdAt * 1000).toLocaleString()}</small>
          <small>Creator: {poll.creator.toString().slice(0, 8)}...{poll.creator.toString().slice(-8)}</small>
        </div>
      </div>

      <div className="share-section">
        <h3>Share this SolPoll.fun poll:</h3>
        <div className="share-buttons">
          <button onClick={() => navigator.share({ title: `SolPoll.fun - Poll #${poll.id}`, text: poll.description, url: window.location.href })}>
            Share
          </button>
          <button onClick={() => navigator.clipboard.writeText(window.location.href)}>
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollDetail;
