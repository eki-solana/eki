pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("51uA4MrH53ToDjm3eF8jcxHfyHZctrU1HtebwyqVkM1U");

#[program]
pub mod eki {
    use super::*;

    pub fn initialize_exits(ctx: Context<InitializeExits>) -> Result<()> {
        ctx.accounts.initialize_exits()?;

        ctx.accounts.initialize_prices()
    }

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        start_slot: u64,
        end_slot_interval: u64,
    ) -> Result<()> {
        ctx.accounts
            .initialize_market(&ctx.bumps, start_slot, end_slot_interval)
    }

    pub fn deposit_token_a(ctx: Context<DepositTokenA>, amount: u64, end_slot: u64) -> Result<()> {
        let current_slot = Clock::get().unwrap().slot;

        ctx.accounts
            .initialize_position_account(&ctx.bumps, amount, end_slot, current_slot)?;

        ctx.accounts.transfer_tokens_to_treasury(amount)?;

        ctx.accounts.update_exits(current_slot)?;

        ctx.accounts.update_market(current_slot)
    }

    pub fn deposit_token_b(ctx: Context<DepositTokenB>, amount: u64, end_slot: u64) -> Result<()> {
        let current_slot = Clock::get().unwrap().slot;

        ctx.accounts
            .initialize_position_account(&ctx.bumps, amount, end_slot, current_slot)?;

        ctx.accounts.transfer_tokens_to_treasury(amount)?;

        ctx.accounts.update_exits(current_slot)?;

        ctx.accounts.update_market(current_slot)
    }

    pub fn withdraw_swapped_token_a(ctx: Context<WithdrawSwappedTokensA>) -> Result<()> {
        let current_slot = Clock::get().unwrap().slot;

        ctx.accounts.update_exits(current_slot)?;

        ctx.accounts.withdraw_swapped_tokens(current_slot)
    }

    pub fn withdraw_swapped_token_b(ctx: Context<WithdrawSwappedTokensB>) -> Result<()> {
        let current_slot = Clock::get().unwrap().slot;

        ctx.accounts.update_exits(current_slot)?;

        ctx.accounts.withdraw_swapped_tokens(current_slot)
    }

    pub fn close_position_a(ctx: Context<ClosePositionA>) -> Result<()> {
        let current_slot = Clock::get().unwrap().slot;

        ctx.accounts.update_exits(current_slot)?;

        ctx.accounts.withdraw_tokens(current_slot)?;

        ctx.accounts.update_market(current_slot)
    }

    pub fn close_position_b(ctx: Context<ClosePositionB>) -> Result<()> {
        let current_slot = Clock::get().unwrap().slot;

        ctx.accounts.update_exits(current_slot)?;

        ctx.accounts.withdraw_tokens(current_slot)?;

        ctx.accounts.update_market(current_slot)
    }

    pub fn update_bookkeeping(ctx: Context<UpdateBookkeeping>) -> Result<()> {
        ctx.accounts.update_exits()
    }
}
