use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PositionA {
    pub amount: u64,
    pub start_slot: u64,
    pub end_slot: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PositionB {
    pub amount: u64,
    pub start_slot: u64,
    pub end_slot: u64,
    pub bump: u8,
}

impl PositionA {
    pub const SEED_PREFIX: &'static str = "position_a";

    pub fn new(amount: u64, start_slot: u64, end_slot: u64, bump: u8) -> Self {
        Self {
            amount,
            start_slot,
            end_slot,
            bump,
        }
    }
}

impl PositionB {
    pub const SEED_PREFIX: &'static str = "position_b";

    pub fn new(amount: u64, start_slot: u64, end_slot: u64, bump: u8) -> Self {
        Self {
            amount,
            start_slot,
            end_slot,
            bump,
        }
    }
}
