const {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction
} = require('@solana/web3.js');
const fs = require('fs');
const BN = require('bn.js');

async function main() {
    // Establish connection to the devnet cluster
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load keypair from file
    const wallet = JSON.parse(fs.readFileSync('wallet.json'));
    const secretKey = Uint8Array.from(wallet);
    const payer = Keypair.fromSecretKey(secretKey);

    // Generate a new keypair for the mint account
    const mint = Keypair.generate();

    // Create a transaction to initialize the mint account
    const tx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(0),
            space: 0,
            programId: new PublicKey('<YOUR_PROGRAM_ID>'),
        }),
    );

    // Send the transaction
    const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [payer, mint],
    );

    console.log('Transaction signature', signature);
    console.log('Mint account public key', mint.publicKey.toBase58());
}

main().catch(err => {
    console.error(err);
});
