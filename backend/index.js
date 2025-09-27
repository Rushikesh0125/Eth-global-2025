const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Contract ABI (only the functions we need)
const CONTRACT_ABI = [
    "function increaseRep(bytes32 userIdentifier, uint256 points) external",
    "function decreaseRep(bytes32 userIdentifier, uint256 points) external",
    "function getRepByUser(bytes32 userIdentifier) public view returns(uint256)",
    "function reputation(bytes32) public view returns(uint256)"
];

// Environment variables
const {
    RPC_URL,
    PRIVATE_KEY,
    CONTRACT_ADDRESS,
    API_KEY
} = process.env;

// Initialize provider and wallet
let provider, wallet, contract;

try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
} catch (error) {
    console.error('Failed to initialize blockchain connection:', error.message);
}

// API Key middleware
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key') || req.query.apiKey;

    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or missing API key'
        });
    }

    next();
};

// Utility function to convert string to bytes32
const stringToBytes32 = (str) => {
    return ethers.id(str);
};

// Utility function to validate points
const validatePoints = (points) => {
    const pointsNum = parseInt(points);
    return !isNaN(pointsNum) && pointsNum > 0 ? pointsNum : null;
};

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Reputation Registry API is running',
        timestamp: new Date().toISOString()
    });
});

// Get reputation by user identifier
app.get('/reputation/:userIdentifier', authenticateApiKey, async (req, res) => {
    try {
        const { userIdentifier } = req.params;
        const userBytes32 = stringToBytes32(userIdentifier);

        const reputation = await contract.getRepByUser(userBytes32);

        res.json({
            success: true,
            data: {
                userIdentifier,
                userBytes32,
                reputation: reputation.toString()
            }
        });
    } catch (error) {
        console.error('Error getting reputation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get reputation',
            details: error.message
        });
    }
});

// Increase reputation
app.post('/reputation/increase', authenticateApiKey, async (req, res) => {
    try {
        const { userIdentifier, points } = req.body;

        if (!userIdentifier || !points) {
            return res.status(400).json({
                success: false,
                error: 'userIdentifier and points are required'
            });
        }

        const validPoints = validatePoints(points);
        if (!validPoints) {
            return res.status(400).json({
                success: false,
                error: 'Points must be a positive integer'
            });
        }

        const userBytes32 = stringToBytes32(userIdentifier);

        // Get current reputation
        const currentRep = await contract.getRepByUser(userBytes32);

        // Execute transaction
        const tx = await contract.increaseRep(userBytes32, validPoints);
        const receipt = await tx.wait();

        // Get new reputation
        const newRep = await contract.getRepByUser(userBytes32);

        res.json({
            success: true,
            message: 'Reputation increased successfully',
            data: {
                userIdentifier,
                userBytes32,
                pointsAdded: validPoints,
                previousReputation: currentRep.toString(),
                newReputation: newRep.toString(),
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            }
        });
    } catch (error) {
        console.error('Error increasing reputation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to increase reputation',
            details: error.message
        });
    }
});

// Decrease reputation
app.post('/reputation/decrease', authenticateApiKey, async (req, res) => {
    try {
        const { userIdentifier, points } = req.body;

        if (!userIdentifier || !points) {
            return res.status(400).json({
                success: false,
                error: 'userIdentifier and points are required'
            });
        }

        const validPoints = validatePoints(points);
        if (!validPoints) {
            return res.status(400).json({
                success: false,
                error: 'Points must be a positive integer'
            });
        }

        const userBytes32 = stringToBytes32(userIdentifier);

        // Get current reputation
        const currentRep = await contract.getRepByUser(userBytes32);

        // Check if user has enough reputation to decrease
        if (currentRep < validPoints) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient reputation to decrease',
                data: {
                    currentReputation: currentRep.toString(),
                    requestedDecrease: validPoints
                }
            });
        }

        // Execute transaction
        const tx = await contract.decreaseRep(userBytes32, validPoints);
        const receipt = await tx.wait();

        // Get new reputation
        const newRep = await contract.getRepByUser(userBytes32);

        res.json({
            success: true,
            message: 'Reputation decreased successfully',
            data: {
                userIdentifier,
                userBytes32,
                pointsRemoved: validPoints,
                previousReputation: currentRep.toString(),
                newReputation: newRep.toString(),
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            }
        });
    } catch (error) {
        console.error('Error decreasing reputation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to decrease reputation',
            details: error.message
        });
    }
});

// Get multiple users' reputation
app.post('/reputation/batch', authenticateApiKey, async (req, res) => {
    try {
        const { userIdentifiers } = req.body;

        if (!Array.isArray(userIdentifiers) || userIdentifiers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'userIdentifiers must be a non-empty array'
            });
        }

        const results = [];

        for (const userIdentifier of userIdentifiers) {
            try {
                const userBytes32 = stringToBytes32(userIdentifier);
                const reputation = await contract.getRepByUser(userBytes32);

                results.push({
                    userIdentifier,
                    userBytes32,
                    reputation: reputation.toString(),
                    success: true
                });
            } catch (error) {
                results.push({
                    userIdentifier,
                    error: error.message,
                    success: false
                });
            }
        }

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error getting batch reputation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get batch reputation',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});



module.exports = app;