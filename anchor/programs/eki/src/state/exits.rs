use anchor_lang::prelude::*;

use crate::EXITS_LENGTH;

#[account(zero_copy)]
#[derive(InitSpace)]
pub struct Exits {
    pub token_a: [u64; EXITS_LENGTH],
    pub token_b: [u64; EXITS_LENGTH],
    pub pointer: u64,
    pub start_slot: u64,
}

impl Exits {
    pub const SEED_PREFIX: &'static str = "exits";

    pub fn new(&mut self, start_slot: u64) {
        self.token_a = [0; EXITS_LENGTH];
        self.token_b = [0; EXITS_LENGTH];
        self.pointer = 0;
        self.start_slot = start_slot;
    }
}
