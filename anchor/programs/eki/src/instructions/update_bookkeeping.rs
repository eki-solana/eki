use crate::constants::*;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateBookkeeping<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
      mut,
      seeds = [Market::SEED_PREFIX.as_bytes()],
      bump = market.bump
    )]
    pub market: Account<'info, Market>,

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

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateBookkeeping<'info> {
    pub fn update_exits(&mut self) -> Result<()> {
        let mut exits = self.exits.load_mut()?;
        let mut prices = self.prices.load_mut()?;

        let current_slot = Clock::get().unwrap().slot;

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
}
