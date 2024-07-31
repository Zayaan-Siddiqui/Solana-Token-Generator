const {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');
const {
    createCreateMetadataAccountV2Instruction,
} = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');

// Define PROGRAM_ID manually if it's not correctly imported
const PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function main() {
    try {
        // Establish connection to the devnet cluster
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

        // Load keypair from file
        const wallet = JSON.parse(fs.readFileSync('wallet.json'));
        const secretKey = Uint8Array.from(wallet);
        const payer = Keypair.fromSecretKey(secretKey);
        console.log('Wallet public key:', payer.publicKey.toBase58());

        // Define the mint address 
        const mintAddress = new PublicKey('EtxawaCcYtvkmCJxegchQSX9GQiqxAy19KbCN2PtD6Wk');
        console.log('Mint address:', mintAddress.toBase58());

        // Define metadata
        const metadataData = {
            name: "Memetest",
            symbol: "METST",
            uri: "https://v2.akord.com/vaults/active/O9gEABFx-bzyOtb5-YbYEeDvx0jnJN7Fp9e_jUt7zkg/gallery#ac2fc224-90b3-4c46-ad9e-b8655246bfa4n",
            creators: null,
        };

        // Find the metadata account address
        const [metadataPDA, _] = await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                PROGRAM_ID.toBuffer(),
                mintAddress.toBuffer(),
            ],
            PROGRAM_ID
        );
        console.log('Metadata PDA:', metadataPDA.toBase58());

        // Create the metadata instruction
        const instruction = createCreateMetadataAccountV2Instruction(
            {
                metadata: metadataPDA,
                mint: mintAddress,
                mintAuthority: payer.publicKey,
                payer: payer.publicKey,
                updateAuthority: payer.publicKey,
            },
            {
                createMetadataAccountArgsV2: {
                    data: metadataData,
                    isMutable: true,
                },
            }
        );

        // Create and send the transaction
        const transaction = new Transaction().add(instruction);
        const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
        console.log('Transaction signature:', signature);
        console.log('Metadata added to mint:', mintAddress.toBase58());
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

main().catch(err => {
    console.error('Error in executing main function:', err);
});
