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
        mut start_slot: u64,
        end_slot_interval: u64,
    ) -> Result<()> {
        msg!("Creating market...");

        if !is_power_of_ten(end_slot_interval) {
            return Err(CustomErrorCode::InvalidSlotInterval.into());
        }

        let current_slot = Clock::get().unwrap().slot;
        if start_slot < current_slot {
            start_slot = current_slot;
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

        let mut exits = self.exits.load_mut()?;
        let mut exits_start_slot = start_slot / end_slot_interval;
        exits_start_slot *= end_slot_interval;
        exits.new(exits_start_slot);

        msg!("Market created starting at slot {}", start_slot);
        Ok(())
    }
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
