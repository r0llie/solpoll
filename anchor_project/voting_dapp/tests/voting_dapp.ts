import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VotingDapp } from "../target/types/voting_dapp";
import { expect } from "chai";

describe("voting_dapp", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.VotingDapp as Program<VotingDapp>;
  const provider = anchor.getProvider();

  // Test accounts
  let creator = anchor.web3.Keypair.generate();
  let voter1 = anchor.web3.Keypair.generate();
  let voter2 = anchor.web3.Keypair.generate();
  
  const pollId = new anchor.BN(1);
  const pollDescription = "Should we implement dark mode?";

  // PDAs
  let pollPda: anchor.web3.PublicKey;
  let vote1Pda: anchor.web3.PublicKey;
  let vote2Pda: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(voter1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(voter2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Find PDAs
    [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [vote1Pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), pollPda.toBuffer(), voter1.publicKey.toBuffer()],
      program.programId
    );

    [vote2Pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), pollPda.toBuffer(), voter2.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Happy Path Tests", () => {
    it("Successfully creates a poll", async () => {
      const tx = await program.methods
        .createPoll(pollId, pollDescription)
        .accounts({
          poll: pollPda,
          creator: creator.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      console.log("Create poll transaction signature:", tx);

      // Verify poll account
      const pollAccount = await program.account.poll.fetch(pollPda);
      expect(pollAccount.id.toString()).to.equal(pollId.toString());
      expect(pollAccount.description).to.equal(pollDescription);
      expect(pollAccount.creator.toString()).to.equal(creator.publicKey.toString());
      expect(pollAccount.yesVotes.toString()).to.equal("0");
      expect(pollAccount.noVotes.toString()).to.equal("0");
      expect(pollAccount.isActive).to.be.true;
    });

    it("Successfully votes YES on a poll", async () => {
      const tx = await program.methods
        .vote(true) // true for YES
        .accounts({
          poll: pollPda,
          voteAccount: vote1Pda,
          voter: voter1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      console.log("Vote YES transaction signature:", tx);

      // Verify vote account
      const voteAccount = await program.account.voteAccount.fetch(vote1Pda);
      expect(voteAccount.poll.toString()).to.equal(pollPda.toString());
      expect(voteAccount.voter.toString()).to.equal(voter1.publicKey.toString());
      expect(voteAccount.option).to.be.true;

      // Verify poll vote count updated
      const pollAccount = await program.account.poll.fetch(pollPda);
      expect(pollAccount.yesVotes.toString()).to.equal("1");
      expect(pollAccount.noVotes.toString()).to.equal("0");
    });

    it("Successfully votes NO on a poll", async () => {
      const tx = await program.methods
        .vote(false) // false for NO
        .accounts({
          poll: pollPda,
          voteAccount: vote2Pda,
          voter: voter2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

      console.log("Vote NO transaction signature:", tx);

      // Verify vote account
      const voteAccount = await program.account.voteAccount.fetch(vote2Pda);
      expect(voteAccount.poll.toString()).to.equal(pollPda.toString());
      expect(voteAccount.voter.toString()).to.equal(voter2.publicKey.toString());
      expect(voteAccount.option).to.be.false;

      // Verify poll vote count updated
      const pollAccount = await program.account.poll.fetch(pollPda);
      expect(pollAccount.yesVotes.toString()).to.equal("1");
      expect(pollAccount.noVotes.toString()).to.equal("1");
    });

    it("Successfully closes a poll", async () => {
      const tx = await program.methods
        .closePoll()
        .accounts({
          poll: pollPda,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      console.log("Close poll transaction signature:", tx);

      // Verify poll is closed
      const pollAccount = await program.account.poll.fetch(pollPda);
      expect(pollAccount.isActive).to.be.false;
    });
  });

  describe("Unhappy Path Tests", () => {
    const pollId2 = new anchor.BN(2);
    let pollPda2: anchor.web3.PublicKey;
    let unauthorizedUser = anchor.web3.Keypair.generate();

    before(async () => {
      // Airdrop SOL to unauthorized user
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(unauthorizedUser.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
      );

      // Find PDA for second poll
      [pollPda2] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), pollId2.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create a new poll for unhappy path tests
      await program.methods
        .createPoll(pollId2, "Another poll")
        .accounts({
          poll: pollPda2,
          creator: creator.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
    });

    it("Fails to create poll with same ID", async () => {
      try {
        await program.methods
          .createPoll(pollId2, "Duplicate poll")
          .accounts({
            poll: pollPda2,
            creator: creator.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });

    it("Fails to vote on inactive poll", async () => {
      try {
        const [inactiveVotePda] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("vote"), pollPda.toBuffer(), unauthorizedUser.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .vote(true)
          .accounts({
            poll: pollPda, // This poll was closed in previous test
            voteAccount: inactiveVotePda,
            voter: unauthorizedUser.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Poll is not active");
      }
    });

    it("Fails to vote twice from same wallet", async () => {
      try {
        // First vote on poll2
        const [voter1Poll2VotePda] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("vote"), pollPda2.toBuffer(), voter1.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .vote(true)
          .accounts({
            poll: pollPda2,
            voteAccount: voter1Poll2VotePda,
            voter: voter1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([voter1])
          .rpc();

        // Try to vote again - this should fail
        await program.methods
          .vote(false)
          .accounts({
            poll: pollPda2,
            voteAccount: voter1Poll2VotePda,
            voter: voter1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([voter1])
          .rpc();
        
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });

    it("Fails to close poll by non-creator", async () => {
      try {
        await program.methods
          .closePoll()
          .accounts({
            poll: pollPda2,
            creator: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Only the poll creator can close the poll");
      }
    });
  });
});
