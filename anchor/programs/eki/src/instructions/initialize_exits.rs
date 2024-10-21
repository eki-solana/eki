use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

use crate::constants::*;
use crate::error::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeExits<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    /// CHECK: We will perform checks in other instructions
    pub exits: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeExits<'info> {
    pub fn initialize_exits(&mut self) -> Result<()> {
        msg!("Initializing exits account...");

        if self.exits.data_len() < ANCHOR_DISCRIMINATOR + Exits::INIT_SPACE {
            return Err(CustomErrorCode::AccountTooSmall.into());
        }

        let discriminator_preimage = b"account:Exits";
        let mut hasher = Sha256::new();
        hasher.update(discriminator_preimage);
        let discriminator = hasher.finalize();

        let mut data = self.exits.data.borrow_mut();
        data[..8].copy_from_slice(&discriminator[..8]);

        msg!("Exits account initialized!");
        Ok(())
    }
}
