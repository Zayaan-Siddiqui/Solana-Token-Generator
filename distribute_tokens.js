const {
    Connection,
    PublicKey,
    Keypair,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction
} = require('@solana/web3.js');
const fs = require('fs');
const BN = require('bn.js');
const borsh = require('borsh');

class TokenInfo {
    constructor(fields = undefined) {
        if (fields) {
            this.total_supply = fields.total_supply;
            this.whitelisted_accounts = fields.whitelisted_accounts;
        }
    }
}

const schema = new Map([
    [TokenInfo, {
        kind: 'struct',
        fields: [
            ['total_supply', 'u64'],
            ['whitelisted_accounts', ['vec', 'pubkey']],
        ],
    }],
]);

async function main() {
    // Establish connection to the devnet cluster
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load keypair from file
    const wallet = JSON.parse(fs.readFileSync('wallet.json'));
    const secretKey = Uint8Array.from(wallet);
    const payer = Keypair.fromSecretKey(secretKey);

    // Define the token info
    const totalSupply = new BN(1000000);  // 1,000,000 tokens
    const whitelistedAccounts = [
        new PublicKey('<WHITELISTED_ACCOUNT_1>'),
        new PublicKey('<WHITELISTED_ACCOUNT_2>')
    ];

    const tokenInfo = new TokenInfo({
        total_supply: totalSupply,
        whitelisted_accounts: whitelistedAccounts
    });

    const data = borsh.serialize(schema, tokenInfo);

    // Create a transaction instruction
    const instruction = new TransactionInstruction({
        keys: [
            {pubkey: payer.publicKey, isSigner: true, isWritable: true},
            {pubkey: new PublicKey('<TOKEN_ACCOUNT>'), isSigner: false, isWritable: true},
            {pubkey: new PublicKey('<MINT_ACCOUNT>'), isSigner: false, isWritable: true},
            {pubkey: new PublicKey('<RENT_ACCOUNT>'), isSigner: false, isWritable: false},
            {pubkey: new PublicKey('<SYSTEM_PROGRAM>'), isSigner: false, isWritable: false},
        ],
        programId: new PublicKey('<YOUR_PROGRAM_ID>'),
        data,
    });

    // Create a transaction
    const tx = new Transaction().add(instruction);

    // Send the transaction
    const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [payer],
    );

    console.log('Transaction signature', signature);
}

main().catch(err => {
    console.error(err);
});
