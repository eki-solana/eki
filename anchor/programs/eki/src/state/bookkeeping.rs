use anchor_lang::prelude::*;

use crate::BOOKKEEPING_PRECISION_FACTOR;

#[account]
#[derive(InitSpace)]
pub struct Bookkeeping {
    pub a_per_b: u64,
    pub b_per_a: u64,
    pub no_trade_slots: u64,
    pub last_slot: u64,
    pub bump: u8,
}

impl Bookkeeping {
    pub const SEED_PREFIX: &'static str = "bookkeeping";

    pub fn new(last_slot: u64, bump: u8) -> Self {
        Self {
            a_per_b: 0,
            b_per_a: 0,
            no_trade_slots: 0,
            last_slot,
            bump,
        }
    }

    pub fn update(&mut self, volume_a: u64, volume_b: u64, current_slot: u64) {
        let slot_diff = current_slot - self.last_slot;
        self.last_slot = current_slot;

        if volume_a == 0 || volume_b == 0 {
            self.no_trade_slots += slot_diff;
            return;
        }

        // TODO: handle overflow
        self.a_per_b += BOOKKEEPING_PRECISION_FACTOR * volume_a / volume_b * slot_diff;
        self.b_per_a += BOOKKEEPING_PRECISION_FACTOR * volume_b / volume_a * slot_diff;
    }
}
