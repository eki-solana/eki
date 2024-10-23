use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::constants::*;
use crate::error::*;
use crate::state::*;

#[derive(Accounts)]
pub struct WithdrawSwappedTokensA<'info> {
    #[account(mut)]
    pub withdrawer: Signer<'info>,

    #[account(
      init_if_needed,
      payer = withdrawer,
      associated_token::mint = token_mint_a,
      associated_token::authority = withdrawer,
      associated_token::token_program = token_program
    )]
    pub withdrawer_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_mint_a: InterfaceAccount<'info, Mint>,

    #[account(
      mut,
      has_one = treasury_a,
      seeds = [Market::SEED_PREFIX.as_bytes()],
      bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
      mut,
      seeds = [PositionB::SEED_PREFIX.as_bytes(), market.key().as_ref(), withdrawer.key().as_ref()],
      bump = position_b.bump
    )]
    pub position_b: Account<'info, PositionB>,

    #[account(
      mut,
      seeds = [TREASURY_A_SEED.as_bytes(), market.key().as_ref()],
      bump
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

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> WithdrawSwappedTokensA<'info> {
    pub fn update_exits(&mut self, current_slot: u64) -> Result<()> {
        let mut exits = self.exits.load_mut()?;

        if current_slot <= self.market.start_slot {
            return Err(CustomErrorCode::NoTokensSwapped.into());
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
        }

        Ok(())
    }

    pub fn withdraw_swapped_tokens(&mut self, current_slot: u64) -> Result<()> {
        let bookkeeping_slot;
        if current_slot < self.position_b.end_slot {
            bookkeeping_slot = current_slot;
        } else {
            bookkeeping_slot = self.position_b.end_slot
        }

        self.bookkeeping.update(
            self.market.token_a_volume,
            self.market.token_b_volume,
            bookkeeping_slot,
        );

        let amount_a = self.position_b.get_volume() / VOLUME_PRECISION
            * (self.bookkeeping.a_per_b - self.position_b.bookkeeping)
            / BOOKKEEPING_PRECISION_FACTOR;

        self.position_b.bookkeeping = self.bookkeeping.a_per_b;

        self.position_b.total_no_trades +=
            self.bookkeeping.no_trade_slots - self.position_b.no_trade_slots;

        self.position_b.no_trade_slots = self.bookkeeping.no_trade_slots;

        let seeds = &[Market::SEED_PREFIX.as_bytes(), &[self.market.bump]];
        let signer_seeds = [&seeds[..]];

        let accounts = TransferChecked {
            from: self.treasury_a.to_account_info(),
            to: self.withdrawer_token_account.to_account_info(),
            mint: self.token_mint_a.to_account_info(),
            authority: self.market.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            &signer_seeds,
        );

        msg!(
            "Withdrawing {} tokens",
            amount_a / u64::pow(10, self.token_mint_a.decimals as u32),
        );
        transfer_checked(cpi_context, amount_a, self.token_mint_a.decimals)
    }
}

#[derive(Accounts)]
pub struct WithdrawSwappedTokensB<'info> {
    #[account(mut)]
    pub withdrawer: Signer<'info>,

    #[account(
      init_if_needed,
      payer = withdrawer,
      associated_token::mint = token_mint_b,
      associated_token::authority = withdrawer,
      associated_token::token_program = token_program
    )]
    pub withdrawer_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_mint_b: InterfaceAccount<'info, Mint>,

    #[account(
      mut,
      has_one = treasury_b,
      seeds = [Market::SEED_PREFIX.as_bytes()],
      bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
      mut,
      seeds = [PositionA::SEED_PREFIX.as_bytes(), market.key().as_ref(), withdrawer.key().as_ref()],
      bump = position_a.bump
    )]
    pub position_a: Account<'info, PositionA>,

    #[account(
      mut,
      seeds = [TREASURY_B_SEED.as_bytes(), market.key().as_ref()],
      bump
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

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> WithdrawSwappedTokensB<'info> {
    pub fn update_exits(&mut self, current_slot: u64) -> Result<()> {
        let mut exits = self.exits.load_mut()?;

        if current_slot <= self.market.start_slot {
            return Err(CustomErrorCode::NoTokensSwapped.into());
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
        }

        Ok(())
    }

    pub fn withdraw_swapped_tokens(&mut self, current_slot: u64) -> Result<()> {
        let bookkeeping_slot;
        if current_slot < self.position_a.end_slot {
            bookkeeping_slot = current_slot;
        } else {
            bookkeeping_slot = self.position_a.end_slot
        }

        self.bookkeeping.update(
            self.market.token_a_volume,
            self.market.token_b_volume,
            bookkeeping_slot,
        );

        let amount_b = self.position_a.get_volume() / VOLUME_PRECISION
            * (self.bookkeeping.b_per_a - self.position_a.bookkeeping)
            / BOOKKEEPING_PRECISION_FACTOR;

        self.position_a.bookkeeping = self.bookkeeping.a_per_b;

        self.position_a.total_no_trades +=
            self.bookkeeping.no_trade_slots - self.position_a.no_trade_slots;

        self.position_a.no_trade_slots = self.bookkeeping.no_trade_slots;

        let seeds = &[Market::SEED_PREFIX.as_bytes(), &[self.market.bump]];
        let signer_seeds = [&seeds[..]];

        let accounts = TransferChecked {
            from: self.treasury_b.to_account_info(),
            to: self.withdrawer_token_account.to_account_info(),
            mint: self.token_mint_b.to_account_info(),
            authority: self.market.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            &signer_seeds,
        );

        msg!(
            "Withdrawing {} tokens",
            amount_b / u64::pow(10, self.token_mint_b.decimals as u32),
        );
        transfer_checked(cpi_context, amount_b, self.token_mint_b.decimals)
    }
}
