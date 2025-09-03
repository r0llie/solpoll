use anchor_lang::prelude::*;

declare_id!("AqVFH6Vq5whfoYGWKtViGpd2oHCNCHi4nc7F8RDNFHxx");

#[program]
pub mod voting_dapp {
    use super::*;

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        poll_id: u64,
        description: String,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let clock = Clock::get()?;

        poll.id = poll_id;
        poll.description = description;
        poll.creator = ctx.accounts.creator.key();
        poll.yes_votes = 0;
        poll.no_votes = 0;
        poll.created_at = clock.unix_timestamp;
        poll.is_active = true;

        msg!("Poll created with ID: {}", poll_id);
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, option: bool) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let vote_account = &mut ctx.accounts.vote_account;

        require!(poll.is_active, ErrorCode::PollNotActive);

        // Record the vote
        vote_account.poll = poll.key();
        vote_account.voter = ctx.accounts.voter.key();
        vote_account.option = option;

        // Update poll vote counts
        if option {
            poll.yes_votes += 1;
        } else {
            poll.no_votes += 1;
        }

        msg!("Vote cast: {} for poll ID: {}", option, poll.id);
        Ok(())
    }

    pub fn close_poll(ctx: Context<ClosePoll>) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        
        require!(poll.creator == ctx.accounts.creator.key(), ErrorCode::UnauthorizedCreator);
        require!(poll.is_active, ErrorCode::PollNotActive);

        poll.is_active = false;
        
        msg!("Poll ID: {} has been closed", poll.id);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct CreatePoll<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 8 + 4 + 200 + 32 + 8 + 8 + 8 + 1, // discriminator + id + string length + description + creator + votes + timestamp + is_active
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    #[account(
        init,
        payer = voter,
        space = 8 + 32 + 32 + 1, // discriminator + poll + voter + option
        seeds = [b"vote", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_account: Account<'info, VoteAccount>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClosePoll<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    pub creator: Signer<'info>,
}

#[account]
pub struct Poll {
    pub id: u64,
    pub description: String,
    pub creator: Pubkey,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub created_at: i64,
    pub is_active: bool,
}

#[account]
pub struct VoteAccount {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub option: bool, // true for yes, false for no
}

#[error_code]
pub enum ErrorCode {
    #[msg("Poll is not active")]
    PollNotActive,
    #[msg("Only the poll creator can close the poll")]
    UnauthorizedCreator,
}
