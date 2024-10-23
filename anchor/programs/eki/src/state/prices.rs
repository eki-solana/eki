use anchor_lang::prelude::*;

use crate::PRICES_LENGTH;

#[account(zero_copy)]
#[derive(InitSpace)]
pub struct Prices {
    pub a_per_b: [u64; PRICES_LENGTH],
    pub b_per_a: [u64; PRICES_LENGTH],
    pub no_trade_slots: [u64; PRICES_LENGTH],
}

impl Prices {
    pub const SEED_PREFIX: &'static str = "prices";

    pub fn new(&mut self) {
        self.a_per_b = [0; PRICES_LENGTH];
        self.b_per_a = [0; PRICES_LENGTH];
        self.no_trade_slots = [0; PRICES_LENGTH];
    }
}
