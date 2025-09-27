const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ASIReputationEngine = require('./modules/AsiRepEngine');
const FirebaseLogisticsService = require('./modules/FirebaseLogisticsService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize services
const reputationEngine = new ASIReputationEngine(process.env.ASI_API_KEY, {
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
    registryAddress: process.env.REGISTRY_CONTRACT_ADDRESS,
    orderRegistryAddress: process.env.ORDER_HISTORY_CONTRACT_ADDRESS
});

const logisticsService = new FirebaseLogisticsService();

// Simple order ID generator
const crypto = require('crypto');
const generateOrderId = () => crypto.randomBytes(16).toString('hex');

// Authentication middleware
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key') || req.query.apiKey;
    if (!apiKey || apiKey !== process.env.AI_API_KEY) {
        return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    next();
};

// Create order
app.post('/orders/create', authenticateApiKey, async (req, res) => {
    try {
        const { userId, orderValue, productCategory, destination, customOrderId } = req.body;
        if (!userId || !orderValue || !productCategory || !destination) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const orderId = customOrderId || generateOrderId();
        const allPartners = await logisticsService.getActiveLogisticPartners();

        if (allPartners.length === 0) {
            return res.status(503).json({ success: false, error: 'No logistic partners available' });
        }

        const orderDetails = { orderId, userId, orderValue, productCategory, destination };
        const result = await reputationEngine.processOrder(orderDetails, allPartners);

        const allocationData = {
            partnerId: result.logisticAllocation.partnerId,
            partnerName: result.logisticAllocation.recommendedPartner,
            allocationMethod: result.logisticAllocation.allocationMethod,
            confidence: result.logisticAllocation.confidence,
            reasoning: result.logisticAllocation.reasoning,
            userReputation: await reputationEngine.blockchainService.getUserReputation(userId),
            deliverySuccessProbability: result.logisticAllocation.deliverySuccessProbability
        };

        const firebaseAllocation = await logisticsService.allocateOrder(orderDetails, allocationData);

        res.json({
            success: true,
            orderId,
            reputationAnalysis: result.reputationAnalysis,
            logisticAllocation: result.logisticAllocation,
            allocationId: firebaseAllocation.allocationId
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Record delivery failure
app.post('/orders/:orderId/delivery-failed', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId, reason, attemptCount } = req.body;

        if (!userId || !reason) return res.status(400).json({ success: false, error: 'Missing fields' });

        const result = await reputationEngine.processDeliveryFailure(orderId, userId, reason, attemptCount);
        const allocations = await logisticsService.getUserAllocations(userId);
        const allocation = allocations.find(a => a.orderId === orderId);

        if (allocation) {
            await logisticsService.updateAllocationStatus(allocation.id, 'failed', { failureReason: reason, attemptCount });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ASI consultation
app.post('/asi/consult', authenticateApiKey, async (req, res) => {
    try {
        const { userId, question, context } = req.body;
        if (!userId || !question) return res.status(400).json({ success: false, error: 'Missing fields' });

        const analytics = await reputationEngine.getUserAnalytics(userId);
        const logisticsHistory = await logisticsService.getUserAllocations(userId, 10);

        const fullContext = { ...context, logisticsHistory };
        const consultation = await reputationEngine.asiClient.makeRequest([
            { role: 'system', content: 'You are an expert e-commerce consultant.' },
            { role: 'user', content: JSON.stringify({ userId, question, analytics, fullContext }) }
        ], 1200);

        res.json({ success: true, consultation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app