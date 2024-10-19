use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::state::*;
use crate::ANCHOR_DISCRIMINATOR;

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_mint_a: InterfaceAccount<'info, Mint>,

    pub token_mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + Market::INIT_SPACE,
        seeds = [Market::SEED_PREFIX.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeMarket<'info> {
    pub fn initialize_market(
        &mut self,
        bumps: &InitializeMarketBumps,
        start_time: i64,
    ) -> Result<()> {
        msg!("Creating market...");
        let start_slot = get_start_slot(start_time).unwrap();

        self.market.set_inner(Market::new(
            self.token_mint_a.key(),
            self.token_mint_b.key(),
            start_slot,
            bumps.market,
        ));

        msg!("Market created starting at slot {}", start_slot);
        Ok(())
    }
}

fn get_start_slot(start_time: i64) -> Result<u64> {
    let current_time = Clock::get().unwrap().unix_timestamp;
    let current_slot = Clock::get().unwrap().slot;

    if start_time <= current_time {
        return Ok(current_slot);
    } else {
        let time_diff = start_time - current_time;
        let estimated_slot_diff = (time_diff * 1000 / 400) as u64;

        return Ok(current_slot + estimated_slot_diff);
    }
}
