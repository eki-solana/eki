use anchor_lang::prelude::*;

#[error_code]
pub enum CustomErrorCode {
    #[msg("End slot has already passed")]
    EndSlotAlreadyPassed,

    #[msg("Account is too small")]
    AccountTooSmall,

    #[msg("Slot interval has to be power of 10")]
    InvalidSlotInterval,

    #[msg("Deposit amount is too small")]
    DepositTooSmall,

    #[msg("No tokens have been swapped yet")]
    NoTokensSwapped,
}
