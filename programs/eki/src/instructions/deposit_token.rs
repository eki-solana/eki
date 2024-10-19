use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::constants::*;
use crate::error::*;
use crate::state::*;

use super::transfer_tokens;

#[derive(Accounts)]
pub struct DepositTokenA<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
      mut,
      associated_token::mint = token_mint_a,
      associated_token::authority = depositor,
      associated_token::token_program = token_program
    )]
    pub depositor_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_mint_a: InterfaceAccount<'info, Mint>,

    #[account(
      mut,
      has_one = token_mint_a,
      seeds = [Market::SEED_PREFIX.as_bytes()],
      bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
      init,
      payer = depositor,
      seeds = [PositionA::SEED_PREFIX.as_bytes(), market.key().as_ref(), depositor.key().as_ref()],
      space = ANCHOR_DISCRIMINATOR + PositionA::INIT_SPACE,
      bump
    )]
    pub position_a: Account<'info, PositionA>,

    #[account(
      mut,
      seeds = [TREASURY_A_SEED.as_bytes(), market.key().as_ref()], bump
    )]
    pub treasury_a: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> DepositTokenA<'info> {
    pub fn initialize_position_account(
        &mut self,
        bumps: &DepositTokenABumps,
        amount: u64,
        duration: u64,
    ) -> Result<()> {
        msg!("Creating position...");

        let start_slot = Clock::get().unwrap().slot;
        let end_slot = get_end_slot(start_slot, duration).unwrap();

        self.position_a.set_inner(PositionA::new(
            amount,
            start_slot,
            end_slot,
            bumps.position_a,
        ));

        msg!("Position created ending at slot {}", end_slot);
        Ok(())
    }

    pub fn transfer_tokens_to_treasury(&self, amount: u64) -> Result<()> {
        transfer_tokens(
            &self.depositor_token_account,
            &self.treasury_a,
            &amount,
            &self.token_mint_a,
            &self.depositor,
            &self.token_program,
        )
    }
}

#[derive(Accounts)]
pub struct DepositTokenB<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    pub token_mint_b: InterfaceAccount<'info, Mint>,

    #[account(
      mut,
      has_one = token_mint_b,
      seeds = [Market::SEED_PREFIX.as_bytes()],
      bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
      init,
      payer = depositor,
      seeds = [PositionB::SEED_PREFIX.as_bytes(), market.key().as_ref(), depositor.key().as_ref()],
      space = ANCHOR_DISCRIMINATOR + PositionB::INIT_SPACE,
      bump
    )]
    pub position_b: Account<'info, PositionB>,

    #[account(
      mut,
      seeds = [TREASURY_B_SEED.as_bytes(), market.key().as_ref()], bump
    )]
    pub treasury_b: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

fn get_end_slot(start_slot: u64, duration: u64) -> Result<u64> {
    if duration <= MINIMUM_TRADE_DURATION_SECONDS {
        return Err(CustomErrorCode::ShortTradeDuration.into());
    }

    let estimated_slot_diff = duration * 1000 / 400;

    // Restrict end slot to be only every 10th slot
    let mut end_slot = (start_slot + estimated_slot_diff + 5) / 10;
    end_slot *= 10;

    return Ok(end_slot);
}
