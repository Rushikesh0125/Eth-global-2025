import app from "./index.js";

const RPC_URL = process.env.RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
const API_KEY = process.env.API_KEY

app.listen(3000, () => {
    console.log(`🚀 Reputation Registry API server running on port ${3000}`);
    console.log(`📋 Health check: http://localhost:${3000}/health`);

    if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS || !API_KEY) {
        console.warn('⚠️  Warning: Missing required environment variables');
        console.log('Required variables: RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, API_KEY');
    }
});
