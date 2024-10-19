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

    pub fn initialize_market(ctx: Context<InitializeMarket>, start_time: i64) -> Result<()> {
        ctx.accounts.initialize_market(&ctx.bumps, start_time)
    }

    pub fn deposit_token_a(ctx: Context<DepositTokenA>, amount: u64, duration: u64) -> Result<()> {
        ctx.accounts
            .initialize_position_account(&ctx.bumps, amount, duration)?;

        ctx.accounts.transfer_tokens_to_treasury(amount)?;

        ctx.accounts.update_market()
    }
}
