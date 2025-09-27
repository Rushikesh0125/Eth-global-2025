const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();
const BlockchainDataService = require('./modules/BlockchainDataService');
const ASIReputationEngine = require('./modules/AsiRepEngine')
const ASIClient = require('./modules/AsiClient');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Contract ABIs
const REGISTRY_ABI = [
    "function increaseRep(bytes32 userIdentifier, uint256 points) external",
    "function decreaseRep(bytes32 userIdentifier, uint256 points) external",
    "function getRepByUser(bytes32 userIdentifier) public view returns(uint256)"
];

const ORDER_HISTORY_ABI = [
    "function createOrder(bytes32 orderId, bytes32 userId, uint256 orderValue, string memory productCategory) external",
    "function updateOrderStatus(bytes32 orderId, uint8 newStatus) external",
    "function recordDeliveryFailure(bytes32 orderId, uint8 reason) external",
    "function recordProductReturn(bytes32 orderId, string memory returnReason) external",
    "function markOrderCompleted(bytes32 orderId) external",
    "function getUserBehaviorStats(bytes32 userId) external view returns (uint256 totalOrders, uint256 completedOrders, uint256 returnedOrders, uint256 deliveryFailures, uint256 totalOrderValue, uint256 avgOrderValue)",
    "function getUserOrderHistory(bytes32 userId) external view returns (tuple(bytes32 orderId, bytes32 userId, uint256 orderValue, uint256 createdAt, uint256 updatedAt, uint8 status, uint8 failureReason, string productCategory, uint8 deliveryAttempts, uint256 returnedAt, string returnReason, bool isActive)[] memory)",
    "function getOrder(bytes32 orderId) external view returns (tuple(bytes32 orderId, bytes32 userId, uint256 orderValue, uint256 createdAt, uint256 updatedAt, uint8 status, uint8 failureReason, string productCategory, uint8 deliveryAttempts, uint256 returnedAt, string returnReason, bool isActive))"
];

// Enums
const OrderStatus = {
    CREATED: 0, PAID: 1, SHIPPED: 2, DELIVERED: 3,
    RETURNED: 4, DELIVERY_FAILED: 5, COMPLETED: 6, CANCELLED: 7
};

const DeliveryFailureReason = {
    NONE: 0, USER_ABSENT: 1, USER_REFUSED: 2, ADDRESS_INVALID: 3, OTHER: 4
};

// Initialize blockchain connection
let provider, wallet, registryContract, orderHistoryContract;

try {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    registryContract = new ethers.Contract(process.env.REGISTRY_CONTRACT_ADDRESS, REGISTRY_ABI, wallet);
    orderHistoryContract = new ethers.Contract(process.env.ORDER_HISTORY_CONTRACT_ADDRESS, ORDER_HISTORY_ABI, wallet);
} catch (error) {
    console.error('Blockchain initialization failed:', error.message);
}

// Utility functions
const stringToBytes32 = (str) => ethers.id(str);
const generateOrderId = () => ethers.id(crypto.randomBytes(16).toString('hex'));

// Initialize engines
const reputationEngine = new ASIReputationEngine();

// Middleware
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key') || req.query.apiKey;
    if (!apiKey || apiKey !== process.env.AI_API_KEY) {
        return res.status(401).json({ success: false, error: 'Invalid or missing API key' });
    }
    next();
};

// Routes

app.get('/health', async (req, res) => {
    let asiStatus = 'unknown';
    try {
        const testResponse = await reputationEngine.asiClient.makeRequest([
            { role: 'system', content: 'Test connection' },
            { role: 'user', content: 'Respond with {"status": "connected"}' }
        ], 50);
        asiStatus = testResponse.status === 'connected' ? 'connected' : 'error';
    } catch (error) {
        asiStatus = 'disconnected';
    }

    res.json({
        success: true,
        message: 'ASI-Powered Reputation Engine Online',
        timestamp: new Date().toISOString(),
        services: {
            asi_api: asiStatus,
            blockchain: provider ? 'connected' : 'disconnected'
        }
    });
});

app.get('/analytics/:userId', authenticateApiKey, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get comprehensive user data
        const userData = await BlockchainDataService.getUserData(userId);
        const userBytes32 = stringToBytes32(userId);
        const currentReputation = await registryContract.getRepByUser(userBytes32);

        // Get ASI risk assessment
        let riskAssessment = null;
        try {
            riskAssessment = await reputationEngine.asiClient.predictCustomerRisk(userData);
        } catch (error) {
            console.warn('Risk assessment failed:', error.message);
        }

        res.json({
            success: true,
            message: 'ASI risk assessment completed',
            data: {
                totalUsers: userIds.length,
                processed: assessments.length,
                assessments,
                summary: {
                    highRisk: assessments.filter(a => a.riskAssessment?.risk_score > 70).length,
                    mediumRisk: assessments.filter(a => a.riskAssessment?.risk_score >= 30 && a.riskAssessment?.risk_score <= 70).length,
                    lowRisk: assessments.filter(a => a.riskAssessment?.risk_score < 30).length
                }
            }
        });
    } catch (error) {
        console.error('Risk assessment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/asi/consult', authenticateApiKey, async (req, res) => {
    try {
        const { userId, question, context } = req.body;

        if (!userId || !question) {
            return res.status(400).json({
                success: false,
                error: 'userId and question are required'
            });
        }

        // Get user data for context
        const userData = await BlockchainDataService.getUserData(userId);
        const userBytes32 = stringToBytes32(userId);
        const currentReputation = await registryContract.getRepByUser(userBytes32);

        // Prepare consultation prompt
        const systemPrompt = `You are an expert e-commerce consultant. Answer specific questions about customers based on their behavior data.`;

        const userPrompt = `
        CUSTOMER CONSULTATION REQUEST:
        
        Customer ID: ${userId}
        Current Reputation Score: ${currentReputation.toString()}
        
        CUSTOMER DATA:
        - Total Orders: ${userData.totalOrders}
        - Completed Orders: ${userData.completedOrders}
        - Returned Orders: ${userData.returnedOrders}
        - Delivery Failures: ${userData.deliveryFailures}
        - Total Spending: ${userData.totalOrderValue.toFixed(2)}
        - Average Order: ${userData.avgOrderValue.toFixed(2)}
        - Return Rate: ${userData.totalOrders > 0 ? ((userData.returnedOrders / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Success Rate: ${userData.totalOrders > 0 ? (((userData.totalOrders - userData.deliveryFailures - userData.returnedOrders) / userData.totalOrders) * 100).toFixed(1) : 0}%

        RECENT ORDERS:
        ${userData.recentOrders.slice(0, 5).map((order, i) =>
            `${i + 1}. ${order.orderValue} - ${reputationEngine.asiClient.getStatusName(order.status)} - ${order.productCategory}`
        ).join('\n')}

        ADDITIONAL CONTEXT: ${context || 'None provided'}
        
        QUESTION: ${question}
        
        Provide a comprehensive answer in JSON format:
        {
            "answer": "Detailed response to the question",
            "confidence": <float 0.0 to 1.0>,
            "recommendation": "Specific recommendation based on analysis",
            "risk_factors": ["factor1", "factor2"],
            "supporting_evidence": ["evidence1", "evidence2"],
            "next_actions": ["action1", "action2"]
        }
        `;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        const consultation = await reputationEngine.asiClient.makeRequest(messages, 1200);

        res.json({
            success: true,
            message: 'ASI consultation completed',
            data: {
                userId,
                question,
                context,
                currentReputation: currentReputation.toString(),
                consultation,
                customerSummary: {
                    totalOrders: userData.totalOrders,
                    returnRate: userData.totalOrders > 0 ? ((userData.returnedOrders / userData.totalOrders) * 100).toFixed(1) + '%' : '0%',
                    avgOrderValue: userData.avgOrderValue.toFixed(2)
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('ASI consultation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/behavior/positive', authenticateApiKey, async (req, res) => {
    try {
        const { userId, behaviorType, orderId, details, impact } = req.body;

        const validBehaviors = ['EARLY_PAYMENT', 'POSITIVE_REVIEW', 'REFERRAL', 'LOYALTY_PROGRAM'];
        if (!validBehaviors.includes(behaviorType)) {
            return res.status(400).json({
                success: false,
                error: `Invalid behavior type. Valid: ${validBehaviors.join(', ')}`
            });
        }

        let orderValue = 0;
        let orderContext = {};

        if (orderId) {
            try {
                const orderBytes32 = stringToBytes32(orderId);
                const order = await orderHistoryContract.getOrder(orderBytes32);
                orderValue = Number(ethers.formatEther(order.orderValue));
                orderContext = {
                    productCategory: order.productCategory,
                    orderAge: Math.floor((Date.now() - Number(order.createdAt) * 1000) / (1000 * 60 * 60 * 24))
                };
            } catch (error) {
                console.warn('Could not fetch order details:', error.message);
            }
        }

        // ASI analysis for positive behavior
        const decision = await reputationEngine.calculateReputationChange(
            userId,
            behaviorType,
            {
                orderValue,
                details,
                impact: impact || 'medium',
                ...orderContext
            }
        );

        // Update reputation
        const reputationTx = await BlockchainDataService.updateReputation(
            userId,
            decision.reputationChange
        );

        res.json({
            success: true,
            message: `Positive behavior (${behaviorType}) analyzed and rewarded`,
            data: {
                userId,
                orderId,
                behaviorType,
                details,
                impact,
                reputationAnalysis: decision,
                blockchain: {
                    reputationUpdate: reputationTx
                }
            }
        });
    } catch (error) {
        console.error('Positive behavior error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/orders/:orderId', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderBytes32 = stringToBytes32(orderId);

        const order = await orderHistoryContract.getOrder(orderBytes32);

        res.json({
            success: true,
            data: {
                orderId,
                orderDetails: {
                    userId: order.userId,
                    orderValue: Number(ethers.formatEther(order.orderValue)).toFixed(2),
                    status: Number(order.status),
                    statusName: reputationEngine.asiClient.getStatusName(Number(order.status)),
                    failureReason: Number(order.failureReason),
                    productCategory: order.productCategory,
                    deliveryAttempts: Number(order.deliveryAttempts),
                    createdAt: new Date(Number(order.createdAt) * 1000).toISOString(),
                    updatedAt: new Date(Number(order.updatedAt) * 1000).toISOString(),
                    returnReason: order.returnReason || null,
                    isActive: order.isActive
                }
            }
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin endpoint to manually trigger reputation recalculation
app.post('/admin/recalculate-reputation', authenticateApiKey, async (req, res) => {
    try {
        const { userId, reason } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        // Get current user data
        const userData = await BlockchainDataService.getUserData(userId);
        const userBytes32 = stringToBytes32(userId);
        const currentReputation = await registryContract.getRepByUser(userBytes32);

        // Get comprehensive ASI analysis
        const riskAssessment = await reputationEngine.asiClient.predictCustomerRisk(userData);

        // Suggest reputation adjustment based on comprehensive analysis
        const systemPrompt = `You are an expert reputation auditor. Based on complete customer history, suggest if reputation adjustment is needed.`;

        const userPrompt = `
        REPUTATION AUDIT REQUEST:
        
        Current Reputation: ${currentReputation.toString()}
        Reason for Review: ${reason || 'Manual review'}
        
        CUSTOMER PERFORMANCE:
        - Total Orders: ${userData.totalOrders}
        - Success Rate: ${userData.totalOrders > 0 ? (((userData.totalOrders - userData.deliveryFailures - userData.returnedOrders) / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Return Rate: ${userData.totalOrders > 0 ? ((userData.returnedOrders / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Total Value: ${userData.totalOrderValue.toFixed(2)}
        
        RISK ASSESSMENT:
        - Risk Score: ${riskAssessment.risk_score}
        - Risk Category: ${riskAssessment.risk_category}
        - Future Return Probability: ${(riskAssessment.future_return_probability * 100).toFixed(1)}%
        
        Based on this analysis, should the reputation be adjusted?
        
        Respond in JSON format:
        {
            "adjustment_needed": true/false,
            "suggested_adjustment": <integer -50 to +50>,
            "justification": "Detailed explanation",
            "confidence": <float 0.0 to 1.0>,
            "audit_summary": "Brief summary of findings"
        }
        `;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        const auditResult = await reputationEngine.asiClient.makeRequest(messages, 800);

        // Apply adjustment if recommended
        let adjustmentTx = null;
        if (auditResult.adjustment_needed && auditResult.suggested_adjustment !== 0) {
            adjustmentTx = await BlockchainDataService.updateReputation(
                userId,
                auditResult.suggested_adjustment
            );
        }

        res.json({
            success: true,
            message: 'Reputation audit completed',
            data: {
                userId,
                reason,
                currentReputation: currentReputation.toString(),
                auditResult,
                riskAssessment,
                adjustmentApplied: !!adjustmentTx,
                blockchain: {
                    adjustmentTransaction: adjustmentTx
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Reputation recalculation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /health - Service health check',
            'GET /analytics/:userId - User behavior analytics',
            'POST /orders/create - Create new order',
            'POST /orders/:orderId/delivery-failed - Record delivery failure',
            'POST /orders/:orderId/return - Record product return',
            'POST /orders/:orderId/complete - Mark order complete',
            'POST /behavior/positive - Record positive behavior',
            'GET /orders/:orderId - Get order details',
            'POST /asi/risk-assessment - Batch risk assessment',
            'POST /asi/consult - AI consultation',
            'POST /admin/recalculate-reputation - Manual reputation audit'
        ]
    });
});

// Graceful startup
const startServer = async () => {
    try {
        // Verify required environment variables
        const requiredVars = [
            'RPC_URL',
            'PRIVATE_KEY',
            'REGISTRY_CONTRACT_ADDRESS',
            'ORDER_HISTORY_CONTRACT_ADDRESS',
            'AI_API_KEY',
            'ASI_API_KEY'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error('❌ Missing required environment variables:', missingVars.join(', '));
            process.exit(1);
        }

        // Test ASI connection
        try {
            const testResponse = await reputationEngine.asiClient.makeRequest([
                { role: 'system', content: 'Connection test' },
                { role: 'user', content: 'Respond with {"test": "success"}' }
            ], 50);

            if (testResponse.test === 'success') {
                console.log('✅ ASI API connection successful');
            } else {
                console.warn('⚠️  ASI API test response unexpected:', testResponse);
            }
        } catch (error) {
            console.warn('⚠️  ASI API connection failed:', error.message);
            console.warn('Will use fallback scoring when ASI is unavailable');
        }

        // Start server
        app.listen(PORT, () => {
            console.log('🚀 ASI-Powered E-commerce Reputation Engine');
            console.log(`📡 Server: http://localhost:${PORT}`);
            console.log(`🤖 ASI Integration: ${process.env.ASI_API_KEY ? 'Enabled' : 'Disabled'}`);
            console.log(`⛓️  Blockchain: ${provider ? 'Connected' : 'Disconnected'}`);
            console.log('📊 Analytics: GET /analytics/:userId');
            console.log('🛒 Orders: POST /orders/create');
            console.log('🎯 AI Features: POST /asi/*');
            console.log('');
            console.log('Ready to analyze customer behavior with ASI intelligence! 🧠');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app; json({
    success: true,
    data: {
        userId,
        currentReputation: currentReputation.toString(),
        statistics: {
            totalOrders: userData.totalOrders,
            completedOrders: userData.completedOrders,
            returnedOrders: userData.returnedOrders,
            deliveryFailures: userData.deliveryFailures,
            totalOrderValue: userData.totalOrderValue,
            avgOrderValue: userData.avgOrderValue
        },
        metrics: {
            returnRate: userData.totalOrders > 0 ?
                ((userData.returnedOrders / userData.totalOrders) * 100).toFixed(1) + '%' : '0%',
            successRate: userData.totalOrders > 0 ?
                (((userData.totalOrders - userData.deliveryFailures - userData.returnedOrders) / userData.totalOrders) * 100).toFixed(1) + '%' : '0%',
            avgDaysBetweenOrders: userData.avgDaysBetweenOrders ? userData.avgDaysBetweenOrders.toFixed(1) : 'N/A'
        },
        riskAssessment,
        recentOrdersCount: userData.recentOrders.length
    }
});

app.post('/orders/create', authenticateApiKey, async (req, res) => {
    try {
        const { userId, orderValue, productCategory, customOrderId } = req.body;

        if (!userId || !orderValue || !productCategory) {
            return res.status(400).json({
                success: false,
                error: 'userId, orderValue, and productCategory are required'
            });
        }

        // Generate order ID
        const orderId = customOrderId ? stringToBytes32(customOrderId) : generateOrderId();
        const userBytes32 = stringToBytes32(userId);

        // Create order on blockchain
        const orderTx = await orderHistoryContract.createOrder(
            orderId,
            userBytes32,
            ethers.parseEther(orderValue.toString()),
            productCategory
        );
        const orderReceipt = await orderTx.wait();

        // Calculate reputation change using ASI
        const decision = await reputationEngine.calculateReputationChange(
            userId,
            'PURCHASE_CREATED',
            { orderValue: parseFloat(orderValue), productCategory }
        );

        // Update reputation on blockchain
        const reputationTx = await BlockchainDataService.updateReputation(
            userId,
            decision.reputationChange
        );

        res.json({
            success: true,
            message: 'Order created with ASI-powered reputation analysis',
            data: {
                orderId: orderId,
                userId,
                orderValue,
                productCategory,
                reputationAnalysis: decision,
                blockchain: {
                    orderCreation: {
                        hash: orderReceipt.hash,
                        blockNumber: orderReceipt.blockNumber
                    },
                    reputationUpdate: reputationTx
                }
            }
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/orders/:orderId/delivery-failed', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId, reason, attemptCount } = req.body;

        if (!userId || !reason) {
            return res.status(400).json({
                success: false,
                error: 'userId and reason are required'
            });
        }

        // Map reason to enum
        const reasonMap = {
            'absent': DeliveryFailureReason.USER_ABSENT,
            'refused': DeliveryFailureReason.USER_REFUSED,
            'invalid_address': DeliveryFailureReason.ADDRESS_INVALID,
            'other': DeliveryFailureReason.OTHER
        };

        const failureReason = reasonMap[reason.toLowerCase()] || DeliveryFailureReason.OTHER;
        const orderBytes32 = stringToBytes32(orderId);

        // Get order details for context
        const currentOrder = await orderHistoryContract.getOrder(orderBytes32);

        // Record failure on blockchain
        const tx = await orderHistoryContract.recordDeliveryFailure(orderBytes32, failureReason);
        const receipt = await tx.wait();

        // Determine action for reputation
        const action = failureReason === DeliveryFailureReason.USER_REFUSED ?
            'DELIVERY_FAILED_REFUSED' : 'DELIVERY_FAILED_ABSENT';

        // ASI-powered reputation analysis
        const decision = await reputationEngine.calculateReputationChange(
            userId,
            action,
            {
                reason,
                attemptCount: attemptCount || 1,
                orderValue: Number(ethers.formatEther(currentOrder.orderValue)),
                productCategory: currentOrder.productCategory
            }
        );

        // Update reputation
        const reputationTx = await BlockchainDataService.updateReputation(
            userId,
            decision.reputationChange
        );

        res.json({
            success: true,
            message: 'Delivery failure analyzed and reputation updated',
            data: {
                orderId,
                userId,
                reason,
                reputationAnalysis: decision,
                blockchain: {
                    deliveryFailure: { hash: receipt.hash, blockNumber: receipt.blockNumber },
                    reputationUpdate: reputationTx
                }
            }
        });
    } catch (error) {
        console.error('Delivery failure error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/orders/:orderId/return', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId, returnReason } = req.body;

        if (!userId || !returnReason) {
            return res.status(400).json({
                success: false,
                error: 'userId and returnReason are required'
            });
        }

        const orderBytes32 = stringToBytes32(orderId);
        const currentOrder = await orderHistoryContract.getOrder(orderBytes32);

        // Record return on blockchain
        const tx = await orderHistoryContract.recordProductReturn(orderBytes32, returnReason);
        const receipt = await tx.wait();

        // ASI analysis for return
        const decision = await reputationEngine.calculateReputationChange(
            userId,
            'PRODUCT_RETURNED',
            {
                returnReason,
                orderValue: Number(ethers.formatEther(currentOrder.orderValue)),
                productCategory: currentOrder.productCategory,
                daysSincePurchase: Math.floor((Date.now() - Number(currentOrder.createdAt) * 1000) / (1000 * 60 * 60 * 24))
            }
        );

        // Update reputation
        const reputationTx = await BlockchainDataService.updateReputation(
            userId,
            decision.reputationChange
        );

        res.json({
            success: true,
            message: 'Product return analyzed and reputation updated',
            data: {
                orderId,
                userId,
                returnReason,
                reputationAnalysis: decision,
                blockchain: {
                    productReturn: { hash: receipt.hash, blockNumber: receipt.blockNumber },
                    reputationUpdate: reputationTx
                }
            }
        });
    } catch (error) {
        console.error('Product return error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/orders/:orderId/complete', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        const orderBytes32 = stringToBytes32(orderId);
        const currentOrder = await orderHistoryContract.getOrder(orderBytes32);

        // Mark as completed on blockchain
        const tx = await orderHistoryContract.markOrderCompleted(orderBytes32);
        const receipt = await tx.wait();

        // ASI analysis for completion
        const decision = await reputationEngine.calculateReputationChange(
            userId,
            'ORDER_COMPLETED',
            {
                orderValue: Number(ethers.formatEther(currentOrder.orderValue)),
                productCategory: currentOrder.productCategory,
                daysSincePurchase: Math.floor((Date.now() - Number(currentOrder.createdAt) * 1000) / (1000 * 60 * 60 * 24))
            }
        );

        // Update reputation
        const reputationTx = await BlockchainDataService.updateReputation(
            userId,
            decision.reputationChange
        );

        res.json({
            success: true,
            message: 'Order completed - customer rewarded',
            data: {
                orderId,
                userId,
                reputationAnalysis: decision,
                blockchain: {
                    orderCompletion: { hash: receipt.hash, blockNumber: receipt.blockNumber },
                    reputationUpdate: reputationTx
                }
            }
        });
    } catch (error) {
        console.error('Order completion error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
