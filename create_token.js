const {
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');
const {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const fs = require('fs');

async function main() {
    // Establish connection to the devnet cluster
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load keypair from file
    const wallet = JSON.parse(fs.readFileSync('wallet.json'));
    const secretKey = Uint8Array.from(wallet);
    const payer = Keypair.fromSecretKey(secretKey);

    // Create a new mint
    const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        null,
        9, // Decimals
    );

    // Create a token account for the payer
    const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    );

    // Mint some tokens to the payer's token account
    await mintTo(
        connection,
        payer,
        mint,
        payerTokenAccount.address,
        payer.publicKey,
        1000000 // Total supply (1,000,000 tokens)
    );

    console.log('Mint public key:', mint.toBase58());
    console.log('Token account:', payerTokenAccount.address.toBase58());
}

main().catch(err => {
    console.error(err);
});
