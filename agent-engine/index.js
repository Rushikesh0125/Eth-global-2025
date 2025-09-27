const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

// Import our custom services
const ASIReputationEngine = require('./ASIReputationEngine');
const FirebaseLogisticsService = require('./FirebaseLogisticsService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const reputationEngine = new ASIReputationEngine(process.env.ASI_API_KEY, {
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
    registryAddress: process.env.REGISTRY_CONTRACT_ADDRESS,
    orderRegistryAddress: process.env.ORDER_REGISTRY_CONTRACT_ADDRESS
});

const logisticsService = new FirebaseLogisticsService();

// Order Status Enum
const OrderStatus = {
    CREATED: 0, PAID: 1, SHIPPED: 2, DELIVERED: 3,
    RETURNED: 4, DELIVERY_FAILED: 5, COMPLETED: 6, CANCELLED: 7
};

// Utility functions
const generateOrderId = () => crypto.randomBytes(16).toString('hex');

// Authentication middleware
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key') || req.query.apiKey;
    if (!apiKey || apiKey !== process.env.AI_API_KEY) {
        return res.status(401).json({ success: false, error: 'Invalid or missing API key' });
    }
    next();
};

// Routes

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
    try {
        // Test all service connections
        const reputationTest = await reputationEngine.testConnections();
        const firebaseTest = await logisticsService.testConnection();

        console.log('📊 Connection Status:');
        console.log(`   ASI API: ${connectionTests.asi.connected ? '✅' : '❌'}`);
        console.log(`   Blockchain: ${connectionTests.blockchain.connected ? '✅' : '❌'}`);
        console.log(`   Firebase: ${firebaseTest.firestore.connected ? '✅' : '❌'}`);

        if (!connectionTests.asi.connected) {
            console.warn('⚠️  ASI API unavailable - will use fallback scoring');
        }

        if (!connectionTests.blockchain.connected) {
            console.error('❌ Blockchain connection failed - cannot continue');
            process.exit(1);
        }

        if (!firebaseTest.firestore.connected) {
            console.error('❌ Firebase connection failed - cannot continue');
            process.exit(1);
        }

        // Start server
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ASI-Powered E-commerce Reputation & Logistics Engine');
            console.log(`📡 Server: http://localhost:${PORT}`);
            console.log(`🧠 ASI Integration: ${connectionTests.asi.connected ? 'Active' : 'Fallback Mode'}`);
            console.log(`⛓️  Blockchain: ${connectionTests.blockchain.connected ? 'Connected' : 'Disconnected'}`);
            console.log(`🔥 Firebase: ${firebaseTest.firestore.connected ? 'Connected' : 'Disconnected'}`);
            console.log('');
            console.log('📋 Key Features:');
            console.log('   • Intelligent reputation scoring with ASI');
            console.log('   • Smart logistics partner allocation');
            console.log('   • Blockchain-based immutable records');
            console.log('   • Real-time logistics tracking');
            console.log('   • Comprehensive analytics dashboard');
            console.log('');
            console.log('🔗 Quick Links:');
            console.log(`   Health Check: http://localhost:${PORT}/health`);
            console.log(`   Analytics: http://localhost:${PORT}/analytics/:userId`);
            console.log(`   Create Order: POST http://localhost:${PORT}/orders/create`);
            console.log(`   Partners: http://localhost:${PORT}/logistics/partners`);
            console.log('');
            console.log('Ready to process intelligent e-commerce operations! 🎯');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app; testConnection();

const services = {
    asi_api: reputationTest.asi,
    blockchain: reputationTest.blockchain,
    firebase: firebaseTest
};

const allHealthy = Object.values(services).every(service =>
    service.connected || (service.firestore && service.firestore.connected)
);

res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    message: 'ASI-Powered E-commerce Agent with Logistics',
    timestamp: new Date().toISOString(),
    services
});


/**
 * Get comprehensive user analytics
 */
app.get('/analytics/:userId', authenticateApiKey, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get reputation analytics
        const analytics = await reputationEngine.getUserAnalytics(userId);

        // Get user's logistics history
        const logisticsHistory = await logisticsService.getUserAllocations(userId);

        res.json({
            success: true,
            data: {
                ...analytics,
                logisticsHistory: {
                    totalAllocations: logisticsHistory.length,
                    recentAllocations: logisticsHistory.slice(0, 5),
                    partnerDistribution: logisticsHistory.reduce((acc, allocation) => {
                        acc[allocation.partnerName] = (acc[allocation.partnerName] || 0) + 1;
                        return acc;
                    }, {})
                }
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Create order with intelligent logistics allocation
 */
app.post('/orders/create', authenticateApiKey, async (req, res) => {
    try {
        const { userId, orderValue, productCategory, destination, customOrderId } = req.body;

        if (!userId || !orderValue || !productCategory || !destination) {
            return res.status(400).json({
                success: false,
                error: 'userId, orderValue, productCategory, and destination are required'
            });
        }

        const orderId = customOrderId || generateOrderId();

        // Get available logistic partners
        const allPartners = await logisticsService.getActiveLogisticPartners();

        if (allPartners.length === 0) {
            return res.status(503).json({
                success: false,
                error: 'No logistic partners available'
            });
        }

        const orderDetails = {
            orderId,
            userId,
            orderValue: parseFloat(orderValue),
            productCategory,
            destination
        };

        // Process order with ASI-powered allocation
        const result = await reputationEngine.processOrder(orderDetails, allPartners);

        // Store allocation in Firebase
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
            message: 'Order created with intelligent logistics allocation',
            data: {
                orderId,
                userId,
                orderValue,
                productCategory,
                destination,
                reputationAnalysis: result.reputationAnalysis,
                logisticAllocation: result.logisticAllocation,
                allocationId: firebaseAllocation.allocationId,
                blockchain: result.blockchain,
                estimatedDelivery: '2-3 business days' // Could be enhanced with real logistics API
            }
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Record delivery failure with reputation penalty
 */
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

        // Process delivery failure with reputation analysis
        const result = await reputationEngine.processDeliveryFailure(orderId, userId, reason, attemptCount);

        // Find and update allocation in Firebase
        const allocations = await logisticsService.getUserAllocations(userId);
        const allocation = allocations.find(a => a.orderId === orderId);

        if (allocation) {
            await logisticsService.updateAllocationStatus(allocation.id, 'failed', {
                failureReason: reason,
                attemptCount: attemptCount || 1
            });
        }

        res.json({
            success: true,
            message: 'Delivery failure recorded and reputation updated',
            data: result
        });
    } catch (error) {
        console.error('Delivery failure error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Record product return with reputation analysis
 */
app.post('/orders/:orderId/return', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId, returnReason } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        // Process product return with reputation analysis
        const result = await reputationEngine.processProductReturn(orderId, userId, returnReason);

        // Update allocation in Firebase
        const allocations = await logisticsService.getUserAllocations(userId);
        const allocation = allocations.find(a => a.orderId === orderId);

        if (allocation) {
            await logisticsService.updateAllocationStatus(allocation.id, 'returned', {
                returnReason: returnReason || ''
            });
        }

        res.json({
            success: true,
            message: 'Product return recorded and reputation updated',
            data: result
        });
    } catch (error) {
        console.error('Product return error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Mark order as completed with rewards
 */
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

        // Process order completion with reputation rewards
        const result = await reputationEngine.processOrderCompletion(orderId, userId);

        // Update allocation in Firebase
        const allocations = await logisticsService.getUserAllocations(userId);
        const allocation = allocations.find(a => a.orderId === orderId);

        if (allocation) {
            await logisticsService.updateAllocationStatus(allocation.id, 'delivered');
        }

        res.json({
            success: true,
            message: 'Order completed - customer rewarded',
            data: result
        });
    } catch (error) {
        console.error('Order completion error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Record positive behavior with rewards
 */
app.post('/behavior/positive', authenticateApiKey, async (req, res) => {
    try {
        const { userId, behaviorType, orderId, details, impact } = req.body;

        const behaviorDetails = {
            orderId,
            details,
            impact: impact || 'medium'
        };

        const result = await reputationEngine.processPositiveBehavior(userId, behaviorType, behaviorDetails);

        res.json({
            success: true,
            message: `Positive behavior (${behaviorType}) recorded and rewarded`,
            data: result
        });
    } catch (error) {
        console.error('Positive behavior error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Logistics Management Routes

/**
 * Add new logistic partner
 */
app.post('/logistics/partners', authenticateApiKey, async (req, res) => {
    try {
        const result = await logisticsService.addLogisticPartner(req.body);

        res.json({
            success: true,
            message: 'Logistic partner added successfully',
            data: result
        });
    } catch (error) {
        console.error('Add partner error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get all active logistic partners
 */
app.get('/logistics/partners', authenticateApiKey, async (req, res) => {
    try {
        const partners = await logisticsService.getActiveLogisticPartners();

        res.json({
            success: true,
            data: {
                partners,
                totalCount: partners.length
            }
        });
    } catch (error) {
        console.error('Get partners error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get partner performance analytics
 */
app.get('/logistics/partners/:partnerId/performance', authenticateApiKey, async (req, res) => {
    try {
        const { partnerId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const performance = await logisticsService.getPartnerPerformance(partnerId, days);
        const capacity = await logisticsService.getPartnerCapacityStatus(partnerId);
        const recentAllocations = await logisticsService.getPartnerAllocations(partnerId, 20);

        res.json({
            success: true,
            data: {
                performance,
                capacity,
                recentAllocations: recentAllocations.slice(0, 10)
            }
        });
    } catch (error) {
        console.error('Partner performance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Search partners by criteria
 */
app.post('/logistics/partners/search', authenticateApiKey, async (req, res) => {
    try {
        const criteria = req.body;
        const partners = await logisticsService.searchPartners(criteria);

        res.json({
            success: true,
            data: {
                partners,
                searchCriteria: criteria,
                resultCount: partners.length
            }
        });
    } catch (error) {
        console.error('Partner search error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get system-wide logistics analytics
 */
app.get('/logistics/analytics', authenticateApiKey, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const analytics = await logisticsService.getSystemAnalytics(days);

        res.json({
            success: true,
            data: {
                ...analytics,
                period: `${days} days`,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('System analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ASI-Powered Analysis Routes

/**
 * Batch risk assessment
 */
app.post('/asi/risk-assessment', authenticateApiKey, async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'userIds array is required'
            });
        }

        const assessments = await reputationEngine.batchRiskAssessment(userIds);

        res.json({
            success: true,
            message: 'Batch risk assessment completed',
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

/**
 * ASI consultation for specific customer questions
 */
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
        const analytics = await reputationEngine.getUserAnalytics(userId);
        const logisticsHistory = await logisticsService.getUserAllocations(userId, 10);

        // Prepare consultation with full context
        const fullContext = {
            ...context,
            logisticsHistory: logisticsHistory.map(allocation => ({
                partner: allocation.partnerName,
                status: allocation.status,
                method: allocation.allocationMethod
            }))
        };

        // Use ASI client directly for consultation
        const systemPrompt = `You are an expert e-commerce consultant with access to customer behavior and logistics data.`;

        const userPrompt = `
        CUSTOMER CONSULTATION REQUEST:
        
        Customer ID: ${userId}
        Current Reputation: ${analytics.currentReputation}
        
        CUSTOMER PROFILE:
        - Total Orders: ${analytics.statistics.totalOrders}
        - Success Rate: ${analytics.metrics.successRate}
        - Return Rate: ${analytics.metrics.returnRate}
        - Recent Logistics: ${logisticsHistory.length} allocations

        QUESTION: ${question}
        CONTEXT: ${JSON.stringify(fullContext)}
        
        Provide comprehensive answer in JSON format:
        {
            "answer": "Detailed response to the question",
            "confidence": <float 0.0 to 1.0>,
            "recommendation": "Specific recommendation",
            "risk_factors": ["factor1", "factor2"],
            "supporting_evidence": ["evidence1", "evidence2"],
            "logistics_insights": ["insight1", "insight2"]
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
                consultation,
                customerSummary: {
                    reputation: analytics.currentReputation,
                    totalOrders: analytics.statistics.totalOrders,
                    successRate: analytics.metrics.successRate,
                    logisticsPartners: [...new Set(logisticsHistory.map(a => a.partnerName))]
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('ASI consultation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin Routes

/**
 * Initialize default logistic partners (for setup)
 */
app.post('/admin/init-partners', authenticateApiKey, async (req, res) => {
    try {
        const result = await logisticsService.initializeDefaultPartners();

        res.json({
            success: true,
            message: 'Default partners initialization completed',
            data: result
        });
    } catch (error) {
        console.error('Partner initialization error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Clean up old logistics records
 */
app.post('/admin/cleanup', authenticateApiKey, async (req, res) => {
    try {
        const daysToKeep = parseInt(req.body.daysToKeep) || 90;
        const result = await logisticsService.cleanupOldRecords(daysToKeep);

        res.json({
            success: true,
            message: `Cleanup completed - removed records older than ${daysToKeep} days`,
            data: result
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get order details with logistics info
app.get('/orders/:orderId', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;

        // Get order from blockchain
        const order = await reputationEngine.blockchainService.getOrder(orderId);

        // Get logistics allocation
        const allocations = await logisticsService.getUserAllocations(order.userId);
        const allocation = allocations.find(a => a.orderId === orderId);

        res.json({
            success: true,
            data: {
                order: {
                    ...order,
                    statusName: reputationEngine.asiClient.getStatusName(order.status),
                    createdAt: new Date(order.createdAt * 1000).toISOString(),
                    updatedAt: new Date(order.updatedAt * 1000).toISOString()
                },
                logistics: allocation || null
            }
        });
    } catch (error) {
        console.error('Get order error:', error);
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
            'GET /analytics/:userId - User analytics with logistics',
            'POST /orders/create - Create order with logistics allocation',
            'POST /orders/:orderId/delivery-failed - Record delivery failure',
            'POST /orders/:orderId/return - Record product return',
            'POST /orders/:orderId/complete - Complete order',
            'POST /behavior/positive - Record positive behavior',
            'GET /orders/:orderId - Get order with logistics info',
            'POST /logistics/partners - Add logistic partner',
            'GET /logistics/partners - Get all partners',
            'GET /logistics/partners/:partnerId/performance - Partner analytics',
            'POST /logistics/partners/search - Search partners',
            'GET /logistics/analytics - System logistics analytics',
            'POST /asi/risk-assessment - Batch risk assessment',
            'POST /asi/consult - ASI consultation'
        ]
    });
});

const startServer = async () => {
    try {
        console.log('🚀 Starting ASI-Powered E-commerce Reputation & Logistics Engine...\n');

        // Verify environment variables
        console.log('📋 Checking environment variables...');
        const requiredVars = [
            'RPC_URL',
            'PRIVATE_KEY',
            'REGISTRY_CONTRACT_ADDRESS',
            'ORDER_REGISTRY_CONTRACT_ADDRESS',
            'AI_API_KEY',
            'ASI_API_KEY'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error('❌ Missing required environment variables:', missingVars.join(', '));
            console.error('💡 Please check your .env file and ensure all variables are set');
            process.exit(1);
        }
        console.log('✅ All required environment variables found\n');

        // Test connections
        console.log('🔧 Testing service connections...');

        console.log('   Testing ASI API...');
        const connectionTests = await reputationEngine.testConnections();

        console.log('   Testing Firebase...');
        const firebaseTest = await logisticsService.testConnection();

        console.log('\n📊 Connection Status Summary:');
        console.log(`   ASI API: ${connectionTests.asi.connected ? '✅ Connected' : '❌ Disconnected'}`);
        if (!connectionTests.asi.connected) {
            console.log(`      Error: ${connectionTests.asi.error}`);
        }

        console.log(`   Blockchain: ${connectionTests.blockchain.connected ? '✅ Connected' : '❌ Disconnected'}`);
        if (connectionTests.blockchain.connected) {
            console.log(`      Network: Block ${connectionTests.blockchain.currentBlock}`);
            console.log(`      Wallet: ${connectionTests.blockchain.walletAddress}`);
            console.log(`      Balance: ${connectionTests.blockchain.walletBalance} ETH`);
        } else {
            console.log(`      Error: ${connectionTests.blockchain.error}`);
        }

        console.log(`   Firebase Firestore: ${firebaseTest.firestore.connected ? '✅ Connected' : '❌ Disconnected'}`);
        console.log(`   Firebase Realtime DB: ${firebaseTest.realtimeDatabase.connected ? '✅ Connected' : '❌ Disconnected'}`);
        if (firebaseTest.firestore.connected) {
            console.log(`      Project ID: ${firebaseTest.projectId}`);
        }

        // Check critical dependencies
        const criticalErrors = [];

        if (!connectionTests.blockchain.connected) {
            criticalErrors.push('Blockchain connection failed - reputation updates will not work');
        }

        if (!firebaseTest.firestore.connected) {
            criticalErrors.push('Firebase Firestore connection failed - logistics tracking will not work');
        }

        if (criticalErrors.length > 0) {
            console.error('\n❌ Critical connection failures:');
            criticalErrors.forEach(error => console.error(`   • ${error}`));
            console.error('\nCannot continue without these services. Please check your configuration.');
            process.exit(1);
        }

        // Warnings for non-critical services
        if (!connectionTests.asi.connected) {
            console.warn('\n⚠️  ASI API unavailable - system will use fallback reputation scoring');
            console.warn('   This may result in less intelligent decision-making');
        }

        if (!firebaseTest.realtimeDatabase.connected) {
            console.warn('\n⚠️  Firebase Realtime Database unavailable - real-time capacity tracking disabled');
        }

        // Initialize default data if needed
        try {
            console.log('\n🔧 Checking logistics partners...');
            const existingPartners = await logisticsService.getActiveLogisticPartners();

            if (existingPartners.length === 0) {
                console.log('   No logistics partners found. Initializing default partners...');
                const initResult = await logisticsService.initializeDefaultPartners();
                console.log(`   ✅ Initialized ${initResult.successCount}/${initResult.totalCount} default partners`);
            } else {
                console.log(`   ✅ Found ${existingPartners.length} active logistics partners`);
            }
        } catch (error) {
            console.warn('   ⚠️  Could not initialize logistics partners:', error.message);
        }

        // Start HTTP server
        console.log('\n🌐 Starting HTTP server...');
        const server = app.listen(PORT, () => {
            console.log('\n' + '='.repeat(80));
            console.log('🚀 ASI-POWERED E-COMMERCE REPUTATION & LOGISTICS ENGINE');
            console.log('='.repeat(80));
            console.log(`📡 Server URL: http://localhost:${PORT}`);
            console.log(`🧠 ASI Mode: ${connectionTests.asi.connected ? 'INTELLIGENT' : 'FALLBACK'}`);
            console.log(`⛓️  Blockchain: ${connectionTests.blockchain.connected ? 'ACTIVE' : 'INACTIVE'}`);
            console.log(`🔥 Firebase: ${firebaseTest.firestore.connected ? 'ACTIVE' : 'INACTIVE'}`);
            console.log(`🕐 Started: ${new Date().toISOString()}`);
            console.log('='.repeat(80));

            console.log('\n📋 CORE FEATURES:');
            console.log('   🧠 Intelligent reputation scoring with ASI');
            console.log('   📦 Smart logistics partner allocation');
            console.log('   ⛓️  Blockchain-based immutable records');
            console.log('   📊 Real-time logistics tracking & analytics');
            console.log('   🎯 Predictive customer risk assessment');
            console.log('   📈 Comprehensive performance dashboards');

            console.log('\n🔗 API ENDPOINTS:');
            console.log(`   📊 Health Check: GET localhost:${PORT}/health`);
            console.log(`   👤 User Analytics: GET localhost:${PORT}/analytics/:userId`);
            console.log(`   🛒 Create Order: POST localhost:${PORT}/orders/create`);
            console.log(`   🚚 Logistics Partners: GET localhost:${PORT}/logistics/partners`);
            console.log(`   🤖 ASI Consultation: POST localhost:${PORT}/asi/consult`);
            console.log(`   📈 System Analytics: GET localhost:${PORT}/logistics/analytics`);

            console.log('\n💡 GETTING STARTED:');
            console.log(`   1. Check system health: curl localhost:${PORT}/health`);
            console.log('   2. Create your first order with intelligent allocation');
            console.log('   3. View comprehensive analytics and insights');
            console.log('   4. Monitor logistics partner performance');

            console.log('\n🎯 READY TO PROCESS INTELLIGENT E-COMMERCE OPERATIONS!');
            console.log('='.repeat(80) + '\n');
        });

        // Handle server startup errors
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
                console.error('💡 Set PORT environment variable to use a different port');
            } else {
                console.error('❌ Server startup error:', err.message);
            }
            process.exit(1);
        });

        // Setup periodic maintenance tasks
        if (firebaseTest.firestore.connected) {
            console.log('🔄 Setting up maintenance tasks...');

            // Cleanup old records every 24 hours
            setInterval(async () => {
                try {
                    console.log('🧹 Running daily cleanup...');
                    const result = await logisticsService.cleanupOldRecords(90);
                    console.log(`✅ Cleanup completed: ${result.cleaned} records removed`);
                } catch (error) {
                    console.warn('⚠️  Daily cleanup failed:', error.message);
                }
            }, 24 * 60 * 60 * 1000); // 24 hours
        }

        return server;

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR DURING STARTUP:');
        console.error('   Error:', error.message);
        if (error.stack) {
            console.error('   Stack:', error.stack);
        }
        console.error('\n💡 TROUBLESHOOTING TIPS:');
        console.error('   • Check your .env file configuration');
        console.error('   • Verify blockchain RPC endpoint is accessible');
        console.error('   • Ensure Firebase serviceAccount.json is present');
        console.error('   • Check ASI API key validity');
        console.error('   • Verify network connectivity');
        console.error('\nExiting...\n');
        process.exit(1);
    }
};