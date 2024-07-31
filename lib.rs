use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    program_pack::{IsInitialized, Pack, Sealed},
    system_instruction,
    program::{invoke_signed, invoke},
    sysvar::{rent::Rent, Sysvar},
    program_error::ProgramError,
};
use borsh::{BorshDeserialize, BorshSerialize};

// Define the entry point of the program
entrypoint!(process_instruction);

// Struct to store token info
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct TokenInfo {
    pub is_initialized: bool,
    pub total_supply: u64,
}

impl Sealed for TokenInfo {}
impl IsInitialized for TokenInfo {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

// Main instruction processor
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Iterating through the accounts
    let accounts_iter = &mut accounts.iter();

    // Getting the account infos from the iterator
    let initializer = next_account_info(accounts_iter)?;
    let token_account = next_account_info(accounts_iter)?;
    let mint_account = next_account_info(accounts_iter)?;
    let rent_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Deserialize the instruction data
    let (total_supply, whitelisted_accounts): (u64, Vec<Pubkey>) = BorshDeserialize::try_from_slice(instruction_data)?;

    // Ensure the initializer is a signer
    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Get the rent exemption data
    let rent = &Rent::from_account_info(rent_account)?;
    let token_info = TokenInfo {
        is_initialized: true,
        total_supply,
    };

    // Serialize the token info into the token account data
    let token_account_data = &mut *token_account.data.borrow_mut();
    if token_account_data.len() < TokenInfo::LEN {
        return Err(ProgramError::AccountDataTooSmall);
    }
    token_info.serialize(&mut *token_account_data)?;

    // Calculate distribution amounts
    let whitelisted_amount = total_supply * 9 / 10;
    let public_amount = total_supply - whitelisted_amount;

    // Transfer tokens to whitelisted accounts
    for whitelisted_account in whitelisted_accounts {
        invoke(
            &system_instruction::transfer(
                initializer.key,
                &whitelisted_account,
                whitelisted_amount,
            ),
            &[
                initializer.clone(),
                AccountInfo::new(
                    &whitelisted_account,
                    false,
                    false,
                    &mut [],
                    &mut [],
                    program_id,
                    false,
                    0,
                ),
            ],
        )?;
    }

    // Transfer remaining tokens to the mint account
    invoke_signed(
        &system_instruction::transfer(
            initializer.key,
            &mint_account.key,
            public_amount,
        ),
        &[
            initializer.clone(),
            mint_account.clone(),
            system_program.clone(),
        ],
        &[&[b"token-mint"]],
    )?;

    Ok(())
}
