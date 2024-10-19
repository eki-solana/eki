use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
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
      has_one = treasury_a,
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
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> DepositTokenA<'info> {
    pub fn initialize_position_account(
        &mut self,
        bumps: &DepositTokenABumps,
        amount: u64,
        mut end_slot: u64,
    ) -> Result<()> {
        msg!("Creating position...");

        let start_slot = Clock::get().unwrap().slot;
        let end_slot_interval = self.market.end_slot_interval;

        // Restrict end slot to be only every power of 10th slot
        end_slot = (end_slot + end_slot_interval / 2) / end_slot_interval;
        end_slot *= end_slot_interval;

        if end_slot <= start_slot {
            return Err(CustomErrorCode::EndSlotAlreadyPassed.into());
        }

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
        msg!(
            "Transferring {} tokens of mint {} to treasury",
            amount / u64::pow(10, self.token_mint_a.decimals as u32),
            &self.token_mint_a.key()
        );
        transfer_tokens(
            &self.depositor_token_account,
            &self.treasury_a,
            &amount,
            &self.token_mint_a,
            &self.depositor,
            &self.token_program,
        )
    }

    pub fn update_market(&mut self) -> Result<()> {
        self.market.token_a_volume += self.position_a.volume;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct DepositTokenB<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    pub token_mint_b: InterfaceAccount<'info, Mint>,

    #[account(
      mut,
      has_one = treasury_b,
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
