use anchor_lang::prelude::*;

#[error_code]
pub enum CustomErrorCode {
    #[msg("Trade duration is too short")]
    ShortTradeDuration,
}
