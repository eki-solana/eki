use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub token_mint_a: Pubkey,
    pub token_mint_b: Pubkey,
    pub token_a_volume: u64,
    pub token_b_volume: u64,
    pub start_slot: u64,
    pub end_slot: Option<u64>,
    pub bump: u8,
}

impl Market {
    pub const SEED_PREFIX: &'static str = "market";

    pub fn new(mint_a: Pubkey, mint_b: Pubkey, start_slot: u64, bump: u8) -> Self {
        Self {
            token_mint_a: mint_a,
            token_mint_b: mint_b,
            token_a_volume: 0,
            token_b_volume: 0,
            start_slot,
            end_slot: None,
            bump,
        }
    }
}