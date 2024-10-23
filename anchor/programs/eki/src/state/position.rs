use anchor_lang::prelude::*;

use crate::VOLUME_PRECISION;

#[account]
#[derive(InitSpace)]
pub struct PositionA {
    pub amount: u64,
    pub start_slot: u64,
    pub end_slot: u64,
    pub bookkeeping: u64,
    pub no_trade_slots: u64,
    pub total_no_trades: u64,
    pub bump: u8,
}

impl PositionA {
    pub const SEED_PREFIX: &'static str = "position_a";

    pub fn new(amount: u64, start_slot: u64, end_slot: u64, bump: u8) -> Self {
        Self {
            amount,
            start_slot,
            end_slot,
            bookkeeping: 0,
            no_trade_slots: 0,
            total_no_trades: 0,
            bump,
        }
    }

    pub fn get_volume(&self) -> u64 {
        let volume = VOLUME_PRECISION * self.amount / (self.end_slot - self.start_slot); // no trading at end slot
        volume
    }
}

#[account]
#[derive(InitSpace)]
pub struct PositionB {
    pub amount: u64,
    pub start_slot: u64,
    pub end_slot: u64,
    pub bookkeeping: u64,
    pub no_trade_slots: u64,
    pub total_no_trades: u64,
    pub bump: u8,
}

impl PositionB {
    pub const SEED_PREFIX: &'static str = "position_b";

    pub fn new(amount: u64, start_slot: u64, end_slot: u64, bump: u8) -> Self {
        Self {
            amount,
            start_slot,
            end_slot,
            bookkeeping: 0,
            no_trade_slots: 0,
            total_no_trades: 0,
            bump,
        }
    }

    pub fn get_volume(&self) -> u64 {
        let volume = VOLUME_PRECISION * self.amount / (self.end_slot - self.start_slot); // no trading at end slot
        volume
    }
}
