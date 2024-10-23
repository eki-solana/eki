use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";

pub const TREASURY_A_SEED: &str = "treasury_a";
pub const TREASURY_B_SEED: &str = "treasury_b";

pub const ANCHOR_DISCRIMINATOR: usize = 8;
pub const MINIMUM_TRADE_DURATION_SECONDS: u64 = 10;
pub const EXITS_LENGTH: usize = 640000;
pub const PRICES_LENGTH: usize = 420000;
pub const MINIMUM_DEPOSIT_AMOUNT: u64 = 1000;
pub const BOOKKEEPING_PRECISION_FACTOR: u64 = 1_000_000;
pub const VOLUME_PRECISION: u64 = 1_000_000;
