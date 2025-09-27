const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json');

/**
 * Firebase Service for managing logistic partners and order allocations
 */
class FirebaseLogisticsService {
    constructor() {
        // Initialize Firebase Admin SDK
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
            });
        }

        this.db = admin.firestore();
        this.realtimeDb = admin.database();

        // Collections
        this.LOGISTIC_PARTNERS_COLLECTION = 'logistic_partners';
        this.ORDER_ALLOCATIONS_COLLECTION = 'order_allocations';
        this.PERFORMANCE_METRICS_COLLECTION = 'partner_performance';
    }

    /**
     * Add or update a logistic partner
     */
    async addLogisticPartner(partnerData) {
        try {
            const partnerId = partnerData.id || admin.firestore().collection('temp').doc().id;

            const partner = {
                id: partnerId,
                name: partnerData.name,
                minReputationThreshold: partnerData.minReputationThreshold || 0,
                maxReputationThreshold: partnerData.maxReputationThreshold || null,
                serviceAreas: partnerData.serviceAreas || [],
                specialCapabilities: partnerData.specialCapabilities || [],
                contactInfo: {
                    email: partnerData.email || '',
                    phone: partnerData.phone || '',
                    address: partnerData.address || ''
                },
                operationalStatus: partnerData.operationalStatus || 'active', // active, inactive, maintenance
                capacityLimits: {
                    dailyOrders: partnerData.dailyOrderLimit || 100,
                    maxOrderValue: partnerData.maxOrderValue || 10000,
                    minOrderValue: partnerData.minOrderValue || 0
                },
                preferences: {
                    productCategories: partnerData.preferredCategories || [],
                    deliveryTypes: partnerData.deliveryTypes || ['standard', 'express'],
                    workingHours: partnerData.workingHours || {
                        start: '09:00',
                        end: '18:00',
                        timezone: 'UTC'
                    }
                },
                performance: {
                    successRate: 0,
                    avgDeliveryTime: 0,
                    customerRating: 0,
                    totalOrdersHandled: 0
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection(this.LOGISTIC_PARTNERS_COLLECTION).doc(partnerId).set(partner);

            console.log(`Logistic partner ${partnerData.name} added successfully`);
            return { success: true, partnerId, partner };
        } catch (error) {
            console.error('Failed to add logistic partner:', error);
            throw new Error(`Failed to add partner: ${error.message}`);
        }
    }

    /**
     * Get all active logistic partners
     */
    async getActiveLogisticPartners() {
        try {
            const snapshot = await this.db.collection(this.LOGISTIC_PARTNERS_COLLECTION)
                .where('operationalStatus', '==', 'active')
                .get();

            const partners = [];
            snapshot.forEach(doc => {
                partners.push({ id: doc.id, ...doc.data() });
            });

            return partners;
        } catch (error) {
            console.error('Failed to fetch logistic partners:', error);
            throw new Error(`Failed to fetch partners: ${error.message}`);
        }
    }

    /**
     * Get logistic partners by service area
     */
    async getPartnersByServiceArea(area) {
        try {
            const snapshot = await this.db.collection(this.LOGISTIC_PARTNERS_COLLECTION)
                .where('operationalStatus', '==', 'active')
                .where('serviceAreas', 'array-contains', area.toLowerCase())
                .get();

            const partners = [];
            snapshot.forEach(doc => {
                partners.push({ id: doc.id, ...doc.data() });
            });

            // If no area-specific partners, get partners that serve all areas
            if (partners.length === 0) {
                const allAreaSnapshot = await this.db.collection(this.LOGISTIC_PARTNERS_COLLECTION)
                    .where('operationalStatus', '==', 'active')
                    .where('serviceAreas', '==', [])
                    .get();

                allAreaSnapshot.forEach(doc => {
                    partners.push({ id: doc.id, ...doc.data() });
                });
            }

            return partners;
        } catch (error) {
            console.error('Failed to fetch partners by service area:', error);
            throw new Error(`Failed to fetch partners by area: ${error.message}`);
        }
    }

    /**
     * Get logistic partners filtered by reputation thresholds
     */
    async getPartnersByReputationRange(userReputation) {
        try {
            const allPartners = await this.getActiveLogisticPartners();

            return allPartners.filter(partner => {
                const minThreshold = partner.minReputationThreshold || 0;
                const maxThreshold = partner.maxReputationThreshold || Number.MAX_SAFE_INTEGER;
                return userReputation >= minThreshold && userReputation <= maxThreshold;
            });
        } catch (error) {
            console.error('Failed to filter partners by reputation:', error);
            throw new Error(`Failed to filter partners: ${error.message}`);
        }
    }

    /**
     * Allocate order to a logistic partner
     */
    async allocateOrder(orderData, allocationData) {
        try {
            const allocationId = `${orderData.orderId}_${Date.now()}`;

            const allocation = {
                id: allocationId,
                orderId: orderData.orderId,
                userId: orderData.userId,
                partnerId: allocationData.partnerId,
                partnerName: allocationData.partnerName,
                orderDetails: {
                    orderValue: orderData.orderValue,
                    productCategory: orderData.productCategory,
                    destination: orderData.destination
                },
                allocationMethod: allocationData.allocationMethod, // 'asi_intelligent', 'random', 'fallback'
                confidence: allocationData.confidence,
                reasoning: allocationData.reasoning || [],
                userReputation: allocationData.userReputation,
                deliverySuccessProbability: allocationData.deliverySuccessProbability,
                status: 'allocated', // allocated, in_transit, delivered, failed, returned
                allocatedAt: admin.firestore.FieldValue.serverTimestamp(),
                estimatedDeliveryTime: allocationData.estimatedDeliveryTime || null,
                actualDeliveryTime: null,
                feedback: {
                    customerRating: null,
                    partnerRating: null,
                    comments: []
                }
            };

            // Save allocation record
            await this.db.collection(this.ORDER_ALLOCATIONS_COLLECTION).doc(allocationId).set(allocation);

            // Update partner's order count in real-time database for capacity management
            const partnerRef = this.realtimeDb.ref(`partner_capacity/${allocationData.partnerId}`);
            await partnerRef.transaction((current) => {
                if (current === null) {
                    return { currentOrders: 1, lastUpdated: Date.now() };
                }
                return {
                    currentOrders: (current.currentOrders || 0) + 1,
                    lastUpdated: Date.now()
                };
            });

            console.log(`Order ${orderData.orderId} allocated to partner ${allocationData.partnerName}`);
            return { success: true, allocationId, allocation };
        } catch (error) {
            console.error('Failed to allocate order:', error);
            throw new Error(`Failed to allocate order: ${error.message}`);
        }
    }

    /**
     * Update order allocation status
     */
    async updateAllocationStatus(allocationId, newStatus, additionalData = {}) {
        try {
            const updateData = {
                status: newStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                ...additionalData
            };

            if (newStatus === 'delivered' && !additionalData.actualDeliveryTime) {
                updateData.actualDeliveryTime = admin.firestore.FieldValue.serverTimestamp();
            }

            await this.db.collection(this.ORDER_ALLOCATIONS_COLLECTION).doc(allocationId).update(updateData);

            // If order is completed/delivered, decrease partner's current order count
            if (['delivered', 'failed', 'returned'].includes(newStatus)) {
                const allocation = await this.getAllocation(allocationId);
                if (allocation && allocation.partnerId) {
                    const partnerRef = this.realtimeDb.ref(`partner_capacity/${allocation.partnerId}`);
                    await partnerRef.transaction((current) => {
                        if (current === null) return current;
                        return {
                            currentOrders: Math.max(0, (current.currentOrders || 0) - 1),
                            lastUpdated: Date.now()
                        };
                    });
                }
            }

            console.log(`Allocation ${allocationId} status updated to ${newStatus}`);
            return { success: true };
        } catch (error) {
            console.error('Failed to update allocation status:', error);
            throw new Error(`Failed to update status: ${error.message}`);
        }
    }

    /**
     * Get allocation details
     */
    async getAllocation(allocationId) {
        try {
            const doc = await this.db.collection(this.ORDER_ALLOCATIONS_COLLECTION).doc(allocationId).get();

            if (!doc.exists) {
                throw new Error('Allocation not found');
            }

            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Failed to get allocation:', error);
            throw new Error(`Failed to get allocation: ${error.message}`);
        }
    }

    /**
     * Get allocations for a specific partner
     */
    async getPartnerAllocations(partnerId, limit = 50) {
        try {
            const snapshot = await this.db.collection(this.ORDER_ALLOCATIONS_COLLECTION)
                .where('partnerId', '==', partnerId)
                .orderBy('allocatedAt', 'desc')
                .limit(limit)
                .get();

            const allocations = [];
            snapshot.forEach(doc => {
                allocations.push({ id: doc.id, ...doc.data() });
            });

            return allocations;
        } catch (error) {
            console.error('Failed to get partner allocations:', error);
            throw new Error(`Failed to get partner allocations: ${error.message}`);
        }
    }

    /**
     * Get allocations for a specific user
     */
    async getUserAllocations(userId, limit = 20) {
        try {
            const snapshot = await this.db.collection(this.ORDER_ALLOCATIONS_COLLECTION)
                .where('userId', '==', userId)
                .orderBy('allocatedAt', 'desc')
                .limit(limit)
                .get();

            const allocations = [];
            snapshot.forEach(doc => {
                allocations.push({ id: doc.id, ...doc.data() });
            });

            return allocations;
        } catch (error) {
            console.error('Failed to get user allocations:', error);
            throw new Error(`Failed to get user allocations: ${error.message}`);
        }
    }

    /**
     * Update partner performance metrics
     */
    async updatePartnerPerformance(partnerId, performanceData) {
        try {
            const performanceUpdate = {
                partnerId,
                successRate: performanceData.successRate,
                avgDeliveryTime: performanceData.avgDeliveryTime,
                customerRating: performanceData.customerRating,
                totalOrdersHandled: performanceData.totalOrdersHandled,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Update in performance collection
            await this.db.collection(this.PERFORMANCE_METRICS_COLLECTION).doc(partnerId).set(performanceUpdate, { merge: true });

            // Update in partner document
            await this.db.collection(this.LOGISTIC_PARTNERS_COLLECTION).doc(partnerId).update({
                'performance.successRate': performanceData.successRate,
                'performance.avgDeliveryTime': performanceData.avgDeliveryTime,
                'performance.customerRating': performanceData.customerRating,
                'performance.totalOrdersHandled': performanceData.totalOrdersHandled,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to update partner performance:', error);
            throw new Error(`Failed to update performance: ${error.message}`);
        }
    }

    /**
     * Get partner performance analytics
     */
    async getPartnerPerformance(partnerId, days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            // Get recent allocations for this partner
            const snapshot = await this.db.collection(this.ORDER_ALLOCATIONS_COLLECTION)
                .where('partnerId', '==', partnerId)
                .where('allocatedAt', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
                .get();

            let totalOrders = 0;
            let successfulDeliveries = 0;
            let totalDeliveryTime = 0;
            let deliveredOrders = 0;
            let totalRating = 0;
            let ratedOrders = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                totalOrders++;

                if (data.status === 'delivered') {
                    successfulDeliveries++;
                    deliveredOrders++;

                    if (data.actualDeliveryTime && data.allocatedAt) {
                        const deliveryTime = data.actualDeliveryTime.toDate() - data.allocatedAt.toDate();
                        totalDeliveryTime += deliveryTime;
                    }

                    if (data.feedback && data.feedback.customerRating) {
                        totalRating += data.feedback.customerRating;
                        ratedOrders++;
                    }
                }
            });

            const performance = {
                partnerId,
                period: `${days} days`,
                totalOrders,
                successRate: totalOrders > 0 ? (successfulDeliveries / totalOrders * 100).toFixed(2) + '%' : '0%',
                avgDeliveryTime: deliveredOrders > 0 ? Math.round(totalDeliveryTime / deliveredOrders / (1000 * 60 * 60)) + ' hours' : 'N/A',
                customerRating: ratedOrders > 0 ? (totalRating / ratedOrders).toFixed(2) : 'N/A',
                calculatedAt: new Date().toISOString()
            };

            return performance;
        } catch (error) {
            console.error('Failed to calculate partner performance:', error);
            throw new Error(`Failed to calculate performance: ${error.message}`);
        }
    }

    /**
     * Get system-wide logistics analytics
     */
    async getSystemAnalytics(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            // Get all allocations in the period
            const snapshot = await this.db.collection(this.ORDER_ALLOCATIONS_COLLECTION)
                .where('allocatedAt', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
                .get();

            const analytics = {
                totalAllocations: 0,
                allocationMethods: {
                    asi_intelligent: 0,
                    random: 0,
                    fallback: 0
                },
                statusDistribution: {
                    allocated: 0,
                    in_transit: 0,
                    delivered: 0,
                    failed: 0,
                    returned: 0
                },
                averageConfidence: 0,
                averageDeliverySuccessProbability: 0
            };

            let totalConfidence = 0;
            let totalSuccessProbability = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                analytics.totalAllocations++;

                analytics.allocationMethods[data.allocationMethod] =
                    (analytics.allocationMethods[data.allocationMethod] || 0) + 1;

                analytics.statusDistribution[data.status] =
                    (analytics.statusDistribution[data.status] || 0) + 1;

                totalConfidence += data.confidence || 0;
                totalSuccessProbability += data.deliverySuccessProbability || 0;
            });

            analytics.averageConfidence = analytics.totalAllocations > 0 ?
                (totalConfidence / analytics.totalAllocations).toFixed(3) : 0;
            analytics.averageDeliverySuccessProbability = analytics.totalAllocations > 0 ?
                (totalSuccessProbability / analytics.totalAllocations).toFixed(3) : 0;

            return analytics;
        } catch (error) {
            console.error('Failed to get system analytics:', error);
            throw new Error(`Failed to get analytics: ${error.message}`);
        }
    }

}

module.exports = FirebaseLogisticsService