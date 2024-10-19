use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PositionA {
    pub amount: u64,
    pub start_slot: u64,
    pub end_slot: u64,
    pub volume: u64,
    pub bookkeeping: u64,
    pub bump: u8,
}

impl PositionA {
    pub const SEED_PREFIX: &'static str = "position_a";

    pub fn new(amount: u64, start_slot: u64, end_slot: u64, bump: u8) -> Self {
        let volume = amount / (end_slot - start_slot); // no trading at end slot

        Self {
            amount,
            start_slot,
            end_slot,
            volume,
            bookkeeping: 0,
            bump,
        }
    }
}
