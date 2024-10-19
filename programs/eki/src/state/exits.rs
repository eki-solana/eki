use anchor_lang::prelude::*;

#[account(zero_copy)]
#[derive(InitSpace)]
pub struct Exits {
    pub token_a: [u64; 262144],
    pub token_b: [u64; 262144],
    pub pointer: u64,
}

impl Exits {
    pub const SEED_PREFIX: &'static str = "exits";

    pub fn new() -> Self {
        Self {
            token_a: [0; 262144],
            token_b: [0; 262144],
            pointer: 0,
        }
    }
}
