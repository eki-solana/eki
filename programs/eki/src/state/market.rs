use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub treasury_a: Pubkey,
    pub treasury_b: Pubkey,
    pub token_a_volume: u64,
    pub token_b_volume: u64,
    pub start_slot: u64,
    pub end_slot: Option<u64>,
    pub bump: u8,
}

impl Market {
    pub const SEED_PREFIX: &'static str = "market";

    pub fn new(treasury_a: Pubkey, treasury_b: Pubkey, start_slot: u64, bump: u8) -> Self {
        Self {
            treasury_a,
            treasury_b,
            token_a_volume: 0,
            token_b_volume: 0,
            start_slot,
            end_slot: None,
            bump,
        }
    }
}
