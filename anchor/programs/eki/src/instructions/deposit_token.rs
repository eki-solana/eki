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

    #[account(
      mut,
      seeds = [Bookkeeping::SEED_PREFIX.as_bytes(), market.key().as_ref()],
      bump = bookkeeping.bump
  )]
    pub bookkeeping: Box<Account<'info, Bookkeeping>>,

    #[account(mut)]
    pub exits: AccountLoader<'info, Exits>,

    #[account(mut)]
    pub prices: AccountLoader<'info, Prices>,

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
        current_slot: u64,
    ) -> Result<()> {
        msg!("Creating position...");

        if amount < MINIMUM_DEPOSIT_AMOUNT * u64::pow(10, self.token_mint_a.decimals as u32) {
            return Err(CustomErrorCode::DepositTooSmall.into());
        }

        let start_slot: u64;
        if current_slot < self.market.start_slot {
            start_slot = self.market.start_slot;
        } else {
            start_slot = current_slot;
        }

        let end_slot_interval = self.market.end_slot_interval;

        // Restrict end slot to be only every power of 10th slot
        end_slot = (end_slot + end_slot_interval / 2) / end_slot_interval;
        end_slot *= end_slot_interval;

        if end_slot < start_slot + end_slot_interval {
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

    pub fn update_exits(&mut self, current_slot: u64) -> Result<()> {
        let mut exits = self.exits.load_mut()?;
        let mut prices = self.prices.load_mut()?;

        // Store what volume is removed from market at which slot
        let exit_slot = self.position_a.end_slot;
        let exit_amount = self.position_a.get_volume();

        let position =
            ((exit_slot - exits.start_slot) / self.market.end_slot_interval) % EXITS_LENGTH as u64;
        exits.token_a[position as usize] += exit_amount;

        if current_slot <= self.market.start_slot {
            return Ok(());
        }

        // Update bookkeeping account up to most current slot that satisfies end_slot_interval
        let mut quotient =
            (current_slot - exits.start_slot) / self.market.end_slot_interval / EXITS_LENGTH as u64;
        let mut new_pointer = ((current_slot - exits.start_slot) / self.market.end_slot_interval)
            % EXITS_LENGTH as u64;

        let old_pointer = exits.pointer;
        exits.pointer = new_pointer;

        if new_pointer < old_pointer {
            new_pointer += EXITS_LENGTH as u64;
            quotient -= 1;
        }

        // start from old_pointer + 1 because old_pointer was handled before with new_pointer
        for i in (old_pointer + 1)..=new_pointer {
            let p = i % EXITS_LENGTH as u64;

            let slot = i * self.market.end_slot_interval
                + exits.start_slot
                + quotient * self.market.end_slot_interval * EXITS_LENGTH as u64;

            self.bookkeeping
                .update(self.market.token_a_volume, self.market.token_b_volume, slot);

            self.market.token_a_volume -= exits.token_a[p as usize];
            self.market.token_b_volume -= exits.token_b[p as usize];

            prices.a_per_b[p as usize] = self.bookkeeping.a_per_b;
            prices.b_per_a[p as usize] = self.bookkeeping.b_per_a;
            prices.no_trade_slots[p as usize] = self.bookkeeping.no_trade_slots;
        }

        Ok(())
    }

    pub fn update_market(&mut self, current_slot: u64) -> Result<()> {
        let old_volume_a = self.market.token_a_volume;

        // update market account
        self.market.token_a_volume += self.position_a.get_volume();

        if current_slot <= self.market.start_slot {
            return Ok(());
        }

        // update bookkeeping account to current state before trade
        self.bookkeeping
            .update(old_volume_a, self.market.token_b_volume, current_slot);

        // store bookkeeping and no_trade_slots in position
        self.position_a.bookkeeping = self.bookkeeping.b_per_a;
        self.position_a.no_trade_slots = self.bookkeeping.no_trade_slots;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct DepositTokenB<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
      mut,
      associated_token::mint = token_mint_b,
      associated_token::authority = depositor,
      associated_token::token_program = token_program
    )]
    pub depositor_token_account: InterfaceAccount<'info, TokenAccount>,

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

    #[account(
      mut,
      seeds = [Bookkeeping::SEED_PREFIX.as_bytes(), market.key().as_ref()],
      bump = bookkeeping.bump
  )]
    pub bookkeeping: Box<Account<'info, Bookkeeping>>,

    #[account(mut)]
    pub exits: AccountLoader<'info, Exits>,

    #[account(mut)]
    pub prices: AccountLoader<'info, Prices>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> DepositTokenB<'info> {
    pub fn initialize_position_account(
        &mut self,
        bumps: &DepositTokenBBumps,
        amount: u64,
        mut end_slot: u64,
        current_slot: u64,
    ) -> Result<()> {
        msg!("Creating position...");

        if amount < MINIMUM_DEPOSIT_AMOUNT * u64::pow(10, self.token_mint_b.decimals as u32) {
            return Err(CustomErrorCode::DepositTooSmall.into());
        }

        let start_slot: u64;
        if current_slot < self.market.start_slot {
            start_slot = self.market.start_slot;
        } else {
            start_slot = current_slot;
        }

        let end_slot_interval = self.market.end_slot_interval;

        // Restrict end slot to be only every power of 10th slot
        end_slot = (end_slot + end_slot_interval / 2) / end_slot_interval;
        end_slot *= end_slot_interval;

        if end_slot < start_slot + end_slot_interval {
            return Err(CustomErrorCode::EndSlotAlreadyPassed.into());
        }

        self.position_b.set_inner(PositionB::new(
            amount,
            start_slot,
            end_slot,
            bumps.position_b,
        ));

        msg!("Position created ending at slot {}", end_slot);
        Ok(())
    }

    pub fn transfer_tokens_to_treasury(&self, amount: u64) -> Result<()> {
        msg!(
            "Transferring {} tokens of mint {} to treasury",
            amount / u64::pow(10, self.token_mint_b.decimals as u32),
            &self.token_mint_b.key()
        );
        transfer_tokens(
            &self.depositor_token_account,
            &self.treasury_b,
            &amount,
            &self.token_mint_b,
            &self.depositor,
            &self.token_program,
        )
    }

    pub fn update_exits(&mut self, current_slot: u64) -> Result<()> {
        let mut exits = self.exits.load_mut()?;
        let mut prices = self.prices.load_mut()?;

        let exit_slot = self.position_b.end_slot;
        let exit_amount = self.position_b.get_volume();

        let position =
            ((exit_slot - exits.start_slot) / self.market.end_slot_interval) % EXITS_LENGTH as u64;
        exits.token_b[position as usize] += exit_amount;

        if current_slot <= self.market.start_slot {
            return Ok(());
        }

        let mut quotient =
            (current_slot - exits.start_slot) / self.market.end_slot_interval / EXITS_LENGTH as u64;
        let mut new_pointer = ((current_slot - exits.start_slot) / self.market.end_slot_interval)
            % EXITS_LENGTH as u64;

        let old_pointer = exits.pointer;
        exits.pointer = new_pointer;

        if new_pointer < old_pointer {
            new_pointer += EXITS_LENGTH as u64;
            quotient -= 1;
        }

        // start from old_pointer + 1 because old_pointer was handled before with new_pointer
        for i in (old_pointer + 1)..=new_pointer {
            let p = i % EXITS_LENGTH as u64;

            let slot = i * self.market.end_slot_interval
                + exits.start_slot
                + quotient * self.market.end_slot_interval * EXITS_LENGTH as u64;

            // update bookkeeping account to current state before trade
            self.bookkeeping
                .update(self.market.token_a_volume, self.market.token_b_volume, slot);

            self.market.token_a_volume -= exits.token_a[p as usize];
            self.market.token_b_volume -= exits.token_b[p as usize];

            prices.a_per_b[p as usize] = self.bookkeeping.a_per_b;
            prices.b_per_a[p as usize] = self.bookkeeping.b_per_a;
            prices.no_trade_slots[p as usize] = self.bookkeeping.no_trade_slots;
        }

        Ok(())
    }

    pub fn update_market(&mut self, current_slot: u64) -> Result<()> {
        let old_volume_b = self.market.token_b_volume;

        // update market account
        self.market.token_b_volume += self.position_b.get_volume();

        if current_slot <= self.market.start_slot {
            return Ok(());
        }

        // update bookkeeping account to current state before trade
        self.bookkeeping
            .update(self.market.token_a_volume, old_volume_b, current_slot);

        // store bookkeeping and no_trade_slots in position
        self.position_b.bookkeeping = self.bookkeeping.a_per_b;
        self.position_b.no_trade_slots = self.bookkeeping.no_trade_slots;

        Ok(())
    }
}
