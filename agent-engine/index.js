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

// ==================== LOGISTIC PARTNER MANAGEMENT ====================

// Add a new logistic partner
app.post('/logistics/partners', authenticateApiKey, async (req, res) => {
    try {
        const partnerData = req.body;

        // Validate required fields
        if (!partnerData.name) {
            return res.status(400).json({ success: false, error: 'Partner name is required' });
        }

        const result = await logisticsService.addLogisticPartner(partnerData);
        res.json({
            success: true,
            message: 'Logistic partner added successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all active logistic partners
app.get('/logistics/partners', authenticateApiKey, async (req, res) => {
    try {
        const partners = await logisticsService.getActiveLogisticPartners();
        res.json({
            success: true,
            data: partners,
            count: partners.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get logistic partners by service area
app.get('/logistics/partners/area/:area', authenticateApiKey, async (req, res) => {
    try {
        const { area } = req.params;
        const partners = await logisticsService.getPartnersByServiceArea(area);
        res.json({
            success: true,
            area: area,
            data: partners,
            count: partners.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get logistic partners by reputation range
app.get('/logistics/partners/reputation/:userReputation', authenticateApiKey, async (req, res) => {
    try {
        const userReputation = parseInt(req.params.userReputation);
        if (isNaN(userReputation)) {
            return res.status(400).json({ success: false, error: 'Invalid reputation value' });
        }

        const partners = await logisticsService.getPartnersByReputationRange(userReputation);
        res.json({
            success: true,
            userReputation: userReputation,
            data: partners,
            count: partners.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ORDER ALLOCATION MANAGEMENT ====================

// Get allocation details
app.get('/logistics/allocations/:allocationId', authenticateApiKey, async (req, res) => {
    try {
        const { allocationId } = req.params;
        const allocation = await logisticsService.getAllocation(allocationId);
        res.json({
            success: true,
            data: allocation
        });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

// Update allocation status
app.put('/logistics/allocations/:allocationId/status', authenticateApiKey, async (req, res) => {
    try {
        const { allocationId } = req.params;
        const { status, additionalData } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, error: 'Status is required' });
        }

        // Validate status values
        const validStatuses = ['allocated', 'in_transit', 'delivered', 'failed', 'returned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Valid options: ${validStatuses.join(', ')}`
            });
        }

        const result = await logisticsService.updateAllocationStatus(allocationId, status, additionalData);
        res.json({
            success: true,
            message: `Allocation status updated to ${status}`,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get partner allocations
app.get('/logistics/partners/:partnerId/allocations', authenticateApiKey, async (req, res) => {
    try {
        const { partnerId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const allocations = await logisticsService.getPartnerAllocations(partnerId, limit);
        res.json({
            success: true,
            partnerId: partnerId,
            data: allocations,
            count: allocations.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user allocations
app.get('/logistics/users/:userId/allocations', authenticateApiKey, async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        const allocations = await logisticsService.getUserAllocations(userId, limit);
        res.json({
            success: true,
            userId: userId,
            data: allocations,
            count: allocations.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== PERFORMANCE MANAGEMENT ====================

// Update partner performance metrics
app.put('/logistics/partners/:partnerId/performance', authenticateApiKey, async (req, res) => {
    try {
        const { partnerId } = req.params;
        const performanceData = req.body;

        // Validate performance data
        const requiredFields = ['successRate', 'avgDeliveryTime', 'customerRating', 'totalOrdersHandled'];
        const missingFields = requiredFields.filter(field => performanceData[field] === undefined);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        const result = await logisticsService.updatePartnerPerformance(partnerId, performanceData);
        res.json({
            success: true,
            message: 'Partner performance updated successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get partner performance analytics
app.get('/logistics/partners/:partnerId/performance', authenticateApiKey, async (req, res) => {
    try {
        const { partnerId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const performance = await logisticsService.getPartnerPerformance(partnerId, days);
        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== SYSTEM ANALYTICS ====================

// Get system-wide logistics analytics
app.get('/logistics/analytics', authenticateApiKey, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const analytics = await logisticsService.getSystemAnalytics(days);
        res.json({
            success: true,
            period: `Last ${days} days`,
            data: analytics
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DELIVERY MANAGEMENT ====================

// Record successful delivery
app.post('/orders/:orderId/delivery-success', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId, customerRating, partnerRating, comments } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        // Find the allocation
        const allocations = await logisticsService.getUserAllocations(userId);
        const allocation = allocations.find(a => a.orderId === orderId);

        if (!allocation) {
            return res.status(404).json({ success: false, error: 'Allocation not found' });
        }

        // Update allocation status with feedback
        const additionalData = {
            'feedback.customerRating': customerRating || null,
            'feedback.partnerRating': partnerRating || null,
            'feedback.comments': comments || []
        };

        await logisticsService.updateAllocationStatus(allocation.id, 'delivered', additionalData);

        // Process reputation update through ASI engine
        const result = await reputationEngine.processSuccessfulDelivery(orderId, userId);

        res.json({
            success: true,
            message: 'Delivery success recorded',
            data: {
                allocationId: allocation.id,
                reputationUpdate: result
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update order status to in-transit
app.put('/orders/:orderId/in-transit', authenticateApiKey, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId, estimatedDeliveryTime, trackingInfo } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        // Find the allocation
        const allocations = await logisticsService.getUserAllocations(userId);
        const allocation = allocations.find(a => a.orderId === orderId);

        if (!allocation) {
            return res.status(404).json({ success: false, error: 'Allocation not found' });
        }

        const additionalData = {
            estimatedDeliveryTime: estimatedDeliveryTime || null,
            trackingInfo: trackingInfo || null
        };

        await logisticsService.updateAllocationStatus(allocation.id, 'in_transit', additionalData);

        res.json({
            success: true,
            message: 'Order status updated to in-transit',
            data: { allocationId: allocation.id }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== BULK OPERATIONS ====================

// Bulk update partner status
app.put('/logistics/partners/bulk/status', authenticateApiKey, async (req, res) => {
    try {
        const { partnerIds, status } = req.body;

        if (!partnerIds || !Array.isArray(partnerIds) || partnerIds.length === 0) {
            return res.status(400).json({ success: false, error: 'partnerIds array is required' });
        }

        if (!status || !['active', 'inactive', 'maintenance'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Valid status required: active, inactive, maintenance'
            });
        }

        const results = [];
        for (const partnerId of partnerIds) {
            try {
                await logisticsService.db.collection(logisticsService.LOGISTIC_PARTNERS_COLLECTION)
                    .doc(partnerId).update({
                        operationalStatus: status,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                results.push({ partnerId, success: true });
            } catch (error) {
                results.push({ partnerId, success: false, error: error.message });
            }
        }

        res.json({
            success: true,
            message: `Bulk status update to ${status} completed`,
            results: results
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get logistics dashboard data
app.get('/logistics/dashboard', authenticateApiKey, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;

        // Get multiple analytics in parallel
        const [systemAnalytics, activePartners] = await Promise.all([
            logisticsService.getSystemAnalytics(days),
            logisticsService.getActiveLogisticPartners()
        ]);

        const dashboard = {
            period: `Last ${days} days`,
            activePartnersCount: activePartners.length,
            systemMetrics: systemAnalytics,
            topPerformers: activePartners
                .sort((a, b) => (b.performance?.successRate || 0) - (a.performance?.successRate || 0))
                .slice(0, 5)
                .map(partner => ({
                    id: partner.id,
                    name: partner.name,
                    successRate: partner.performance?.successRate || 0,
                    totalOrders: partner.performance?.totalOrdersHandled || 0,
                    customerRating: partner.performance?.customerRating || 0
                }))
        };

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint for logistics service
app.get('/logistics/health', authenticateApiKey, async (req, res) => {
    try {
        // Test database connectivity
        const testQuery = await logisticsService.db.collection(logisticsService.LOGISTIC_PARTNERS_COLLECTION).limit(1).get();

        res.json({
            success: true,
            message: 'Logistics service is healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            collections: {
                partners: logisticsService.LOGISTIC_PARTNERS_COLLECTION,
                allocations: logisticsService.ORDER_ALLOCATIONS_COLLECTION,
                performance: logisticsService.PERFORMANCE_METRICS_COLLECTION
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logistics service health check failed',
            error: error.message
        });
    }
});

module.exports = app