use anchor_lang::prelude::*;

#[error_code]
pub enum CustomErrorCode {
    #[msg("End slot has already passed")]
    EndSlotAlreadyPassed,
}
