use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::ANCHOR_DISCRIMINATOR;
use crate::{constants::*, error::*, state::*};

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub token_mint_a: Box<InterfaceAccount<'info, Mint>>,

    #[account(mint::token_program = token_program)]
    pub token_mint_b: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + Market::INIT_SPACE,
        seeds = [Market::SEED_PREFIX.as_bytes()],
        bump
    )]
    pub market: Box<Account<'info, Market>>,

    #[account(
        init,
        token::mint = token_mint_a,
        token::authority = market,
        payer = signer,
        seeds = [TREASURY_A_SEED.as_bytes(), market.key().as_ref()],
        bump
    )]
    pub treasury_a: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init,
        token::mint = token_mint_b,
        token::authority = market,
        payer = signer,
        seeds = [TREASURY_B_SEED.as_bytes(), market.key().as_ref()],
        bump
    )]
    pub treasury_b: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + Bookkeeping::INIT_SPACE,
        seeds = [Bookkeeping::SEED_PREFIX.as_bytes(), market.key().as_ref()],
        bump
    )]
    pub bookkeeping: Box<Account<'info, Bookkeeping>>,

    #[account(mut)]
    pub exits: AccountLoader<'info, Exits>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeMarket<'info> {
    pub fn initialize_market(
        &mut self,
        bumps: &InitializeMarketBumps,
        start_time: i64, // TODO: change to start_slot
        end_slot_interval: u64,
    ) -> Result<()> {
        msg!("Creating market...");
        let start_slot = get_start_slot(start_time).unwrap();

        if !is_power_of_ten(end_slot_interval) {
            return Err(CustomErrorCode::InvalidSlotInterval.into());
        }

        self.market.set_inner(Market::new(
            self.treasury_a.key(),
            self.treasury_b.key(),
            start_slot,
            end_slot_interval,
            bumps.market,
        ));

        self.bookkeeping
            .set_inner(Bookkeeping::new(start_slot, bumps.bookkeeping));

        msg!("Market created starting at slot {}", start_slot);
        Ok(())
    }
}

fn get_start_slot(start_time: i64) -> Result<u64> {
    let current_time = Clock::get().unwrap().unix_timestamp;
    let current_slot = Clock::get().unwrap().slot;

    if start_time <= current_time {
        return Ok(current_slot);
    }

    let time_diff = start_time - current_time;
    let estimated_slot_diff = (time_diff * 1000 / 400) as u64;

    return Ok(current_slot + estimated_slot_diff);
}

fn is_power_of_ten(n: u64) -> bool {
    if n == 0 {
        return false;
    }

    let mut num = n;
    while num % 10 == 0 {
        num /= 10;
    }

    num == 1
}
