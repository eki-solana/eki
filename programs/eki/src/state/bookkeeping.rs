use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Bookkeeping {
    pub a_per_b: u64,
    pub no_a: u64,
    pub b_per_a: u64,
    pub no_b: u64,
    pub last_slot: u64,
    pub bump: u8,
}

impl Bookkeeping {
    pub const SEED_PREFIX: &'static str = "bookkeeping";

    pub fn new(last_slot: u64, bump: u8) -> Self {
        Self {
            a_per_b: 0,
            no_a: 0,
            b_per_a: 0,
            no_b: 0,
            last_slot,
            bump,
        }
    }
}
