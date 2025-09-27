import app from "./index";

app.listen(PORT, () => {
    console.log(`🚀 Reputation Registry API server running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);

    if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS || !API_KEY) {
        console.warn('⚠️  Warning: Missing required environment variables');
        console.log('Required variables: RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, API_KEY');
    }
});
