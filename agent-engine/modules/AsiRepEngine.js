const ASIClient = require('./AsiClient');
const BlockchainDataService = require('./BlockchainDataService');

/**
 * ASI-Powered Reputation Engine
 * Handles intelligent reputation scoring and logistic partner allocation
 */
class ASIReputationEngine {
    constructor(asiApiKey, blockchainConfig) {
        this.asiClient = new ASIClient(asiApiKey);
        this.blockchainService = new BlockchainDataService(
            blockchainConfig.rpcUrl,
            blockchainConfig.privateKey,
            blockchainConfig.registryAddress,
            blockchainConfig.orderRegistryAddress
        );
        this.fallbackEnabled = true;
    }

    /**
     * Calculate reputation change using ASI analysis
     */
    async calculateReputationChange(userId, action, actionContext = {}) {
        try {
            // Get user data from blockchain
            const userData = await this.blockchainService.getUserData(userId);

            // If new user with no history, use simple scoring
            if (userData.totalOrders === 0 && !['PURCHASE_CREATED', 'PAYMENT_COMPLETED'].includes(action)) {
                return this.getNewUserScore(action);
            }

            // Use ASI for intelligent analysis
            const asiAnalysis = await this.asiClient.analyzeReputationChange(userData, action, actionContext);

            // Validate ASI response
            this.validateASIResponse(asiAnalysis);

            // Get risk prediction
            let riskPrediction = null;
            try {
                riskPrediction = await this.asiClient.predictCustomerRisk(userData);
            } catch (error) {
                console.warn('Risk prediction failed:', error.message);
            }

            return {
                reputationChange: asiAnalysis.reputation_change,
                confidence: asiAnalysis.confidence,
                analysis: {
                    customerTier: asiAnalysis.customer_tier,
                    riskLevel: asiAnalysis.risk_level,
                    primaryFactors: asiAnalysis.primary_factors,
                    explanation: asiAnalysis.explanation,
                    recommendations: asiAnalysis.recommendations
                },
                riskPrediction,
                userData: {
                    totalOrders: userData.totalOrders,
                    successRate: userData.totalOrders > 0 ?
                        (((userData.totalOrders - userData.deliveryFailures - userData.returnedOrders) / userData.totalOrders) * 100).toFixed(1) + '%' : '0%',
                    avgOrderValue: userData.avgOrderValue
                },
                asiPowered: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('ASI analysis failed:', error.message);

            if (this.fallbackEnabled) {
                console.warn('Using fallback scoring system');
                return this.getFallbackScore(action, actionContext);
            }

            throw error;
        }
    }

    /**
     * Analyze and allocate logistic partner using ASI
     */
    async analyzeLogisticAllocation(userId, orderDetails, logisticPartners) {
        try {
            // Get user data and current reputation
            const userData = await this.blockchainService.getUserData(userId);
            const currentReputation = await this.blockchainService.getUserReputation(userId);

            // Filter partners by service area if specified
            const availablePartners = logisticPartners.filter(partner => {
                if (!partner.serviceAreas || partner.serviceAreas.length === 0) {
                    return true; // Partner serves all areas
                }
                return partner.serviceAreas.some(area =>
                    orderDetails.destination.toLowerCase().includes(area.toLowerCase())
                );
            });

            if (availablePartners.length === 0) {
                throw new Error('No logistic partners available for this destination');
            }

            // Filter partners by reputation threshold
            const qualifiedPartners = availablePartners.filter(partner => {
                const minThreshold = partner.minReputationThreshold || 0;
                const maxThreshold = partner.maxReputationThreshold || Number.MAX_SAFE_INTEGER;
                return currentReputation >= minThreshold && currentReputation <= maxThreshold;
            });

            // If no qualified partners, return random allocation
            if (qualifiedPartners.length === 0) {
                const randomPartner = availablePartners[Math.floor(Math.random() * availablePartners.length)];
                return {
                    recommendedPartner: randomPartner.name,
                    partnerId: randomPartner.id,
                    confidence: 0.3,
                    reasoning: ['No partners match reputation threshold', 'Random allocation applied'],
                    allocationMethod: 'random',
                    deliverySuccessProbability: 0.6
                };
            }

            // Use ASI to analyze the best match
            const asiAnalysis = await this.asiClient.analyzeLogisticAllocation(
                { ...userData, userId },
                currentReputation,
                orderDetails,
                qualifiedPartners
            );

            // Find the recommended partner
            const recommendedPartner = qualifiedPartners.find(
                partner => partner.name === asiAnalysis.recommended_partner || partner.id === asiAnalysis.partner_id
            );

            if (!recommendedPartner) {
                // Fallback to first qualified partner
                const fallbackPartner = qualifiedPartners[0];
                return {
                    recommendedPartner: fallbackPartner.name,
                    partnerId: fallbackPartner.id,
                    confidence: 0.5,
                    reasoning: ['ASI recommendation not found', 'Using first qualified partner'],
                    allocationMethod: 'fallback',
                    deliverySuccessProbability: 0.7
                };
            }

            return {
                recommendedPartner: recommendedPartner.name,
                partnerId: recommendedPartner.id,
                confidence: asiAnalysis.confidence,
                reasoning: asiAnalysis.reasoning,
                riskMitigation: asiAnalysis.risk_mitigation,
                alternativePartners: asiAnalysis.alternative_partners,
                deliverySuccessProbability: asiAnalysis.delivery_success_probability,
                allocationMethod: 'asi_intelligent',
                partnerDetails: {
                    minReputationThreshold: recommendedPartner.minReputationThreshold,
                    maxReputationThreshold: recommendedPartner.maxReputationThreshold,
                    serviceAreas: recommendedPartner.serviceAreas,
                    specialCapabilities: recommendedPartner.specialCapabilities
                }
            };

        } catch (error) {
            console.error('Logistic allocation analysis failed:', error);
            throw new Error(`Allocation analysis failed: ${error.message}`);
        }
    }

    /**
     * Process order with reputation analysis and logistic allocation
     */
    async processOrder(userId, orderDetails, logisticPartners) {
        try {
            // 1. Analyze reputation change for order creation
            const reputationAnalysis = await this.calculateReputationChange(
                userId,
                'PURCHASE_CREATED',
                {
                    orderValue: orderDetails.orderValue,
                    productCategory: orderDetails.productCategory,
                    destination: orderDetails.destination
                }
            );

            // 2. Update reputation on blockchain
            const reputationTx = await this.blockchainService.updateReputation(
                userId,
                reputationAnalysis.reputationChange
            );

            // 3. Analyze and allocate logistic partner
            const logisticAllocation = await this.analyzeLogisticAllocation(
                userId,
                orderDetails,
                logisticPartners
            );

            // 4. Create order on blockchain
            const orderTx = await this.blockchainService.createOrder(
                orderDetails.orderId,
                userId,
                orderDetails.orderValue,
                orderDetails.productCategory,
                orderDetails.destination
            );

            return {
                reputationAnalysis,
                logisticAllocation,
                blockchain: {
                    reputationUpdate: reputationTx,
                    orderCreation: orderTx
                },
                success: true
            };

        } catch (error) {
            console.error('Order processing failed:', error);
            throw new Error(`Order processing failed: ${error.message}`);
        }
    }

    /**
     * Validate ASI response format
     */
    validateASIResponse(response) {
        if (!response || typeof response.reputation_change !== 'number') {
            throw new Error('Invalid ASI response: missing reputation_change');
        }

        if (response.reputation_change < -100 || response.reputation_change > 100) {
            throw new Error('Invalid ASI response: reputation_change out of bounds');
        }
    }

    /**
     * Get scoring for new users
     */
    getNewUserScore(action) {
        const newUserScores = {
            'PURCHASE_CREATED': 10,
            'PAYMENT_COMPLETED': 15,
            'DELIVERY_ACCEPTED': 20,
            'ORDER_COMPLETED': 25,
            'PRODUCT_RETURNED': -8,
            'DELIVERY_FAILED_ABSENT': -12,
            'DELIVERY_FAILED_REFUSED': -15
        };

        return {
            reputationChange: newUserScores[action] || 0,
            confidence: 0.8,
            analysis: {
                customerTier: 'new',
                riskLevel: 'low',
                primaryFactors: ['New customer baseline'],
                explanation: `New customer baseline scoring for action: ${action}`,
                recommendations: ['Monitor initial behavior patterns']
            },
            asiPowered: false,
            newCustomer: true
        };
    }

    /**
     * Get fallback score when ASI is unavailable
     */
    getFallbackScore(action, actionContext) {
        const fallbackScores = {
            'PURCHASE_CREATED': 8,
            'PAYMENT_COMPLETED': 12,
            'DELIVERY_ACCEPTED': 18,
            'ORDER_COMPLETED': 25,
            'PRODUCT_RETURNED': -12,
            'DELIVERY_FAILED_ABSENT': -18,
            'DELIVERY_FAILED_REFUSED': -25,
            'EARLY_PAYMENT': 10,
            'POSITIVE_REVIEW': 15
        };

        return {
            reputationChange: fallbackScores[action] || 0,
            confidence: 0.6,
            analysis: {
                customerTier: 'unknown',
                riskLevel: 'medium',
                primaryFactors: ['Fallback rule-based scoring'],
                explanation: `Fallback scoring applied due to ASI unavailability: ${action}`,
                recommendations: ['Retry with ASI when available']
            },
            asiPowered: false,
            fallbackReason: 'ASI service unavailable'
        };
    }

    /**
     * Get comprehensive user analytics
     */
    async getUserAnalytics(userId) {
        try {
            const userData = await this.blockchainService.getUserData(userId);
            const currentReputation = await this.blockchainService.getUserReputation(userId);

            let riskAssessment = null;
            try {
                riskAssessment = await this.asiClient.predictCustomerRisk(userData);
            } catch (error) {
                console.warn('Risk assessment failed:', error.message);
            }

            return {
                userId,
                currentReputation,
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
            };
        } catch (error) {
            console.error('User analytics failed:', error);
            throw new Error(`Analytics failed: ${error.message}`);
        }
    }

    /**
     * Test all service connections
     */
    async testConnections() {
        const results = {};

        // Test ASI connection
        try {
            const testResponse = await this.asiClient.makeRequest([
                { role: 'system', content: 'Test connection' },
                { role: 'user', content: 'Respond with {"test": "success"}' }
            ], 50);
            results.asi = { connected: testResponse.test === 'success', error: null };
        } catch (error) {
            results.asi = { connected: false, error: error.message };
        }

        // Test blockchain connection
        results.blockchain = await this.blockchainService.testConnection();

        return results;
    }

    /**
     * Process delivery failure with reputation penalty
     */
    async processDeliveryFailure(orderId, userId, reason, attemptCount = 1) {
        try {
            // Record on blockchain first
            const DeliveryFailureReason = {
                'absent': 1, // USER_ABSENT
                'refused': 2, // USER_REFUSED
                'invalid_address': 3, // ADDRESS_INVALID
                'other': 4 // OTHER
            };

            const failureReason = DeliveryFailureReason[reason.toLowerCase()] || 4;
            const blockchainTx = await this.blockchainService.recordDeliveryFailure(orderId, failureReason);

            // Get order details for context
            const orderDetails = await this.blockchainService.getOrder(orderId);

            // Determine reputation action
            const action = failureReason === 2 ? 'DELIVERY_FAILED_REFUSED' : 'DELIVERY_FAILED_ABSENT';

            // Calculate reputation change
            const reputationAnalysis = await this.calculateReputationChange(
                userId,
                action,
                {
                    reason,
                    attemptCount,
                    orderValue: orderDetails.orderValue,
                    productCategory: orderDetails.productCategory,
                    destination: orderDetails.destination
                }
            );

            // Update reputation
            const reputationTx = await this.blockchainService.updateReputation(
                userId,
                reputationAnalysis.reputationChange
            );

            return {
                orderId,
                userId,
                reason,
                reputationAnalysis,
                blockchain: {
                    deliveryFailure: blockchainTx,
                    reputationUpdate: reputationTx
                },
                success: true
            };

        } catch (error) {
            console.error('Delivery failure processing failed:', error);
            throw new Error(`Delivery failure processing failed: ${error.message}`);
        }
    }

    /**
     * Process product return with reputation analysis
     */
    async processProductReturn(orderId, userId, returnReason = '') {
        try {
            // Record on blockchain
            const blockchainTx = await this.blockchainService.recordProductReturn(orderId);

            // Get order details for context
            const orderDetails = await this.blockchainService.getOrder(orderId);

            // Calculate reputation change
            const reputationAnalysis = await this.calculateReputationChange(
                userId,
                'PRODUCT_RETURNED',
                {
                    returnReason,
                    orderValue: orderDetails.orderValue,
                    productCategory: orderDetails.productCategory,
                    destination: orderDetails.destination,
                    daysSincePurchase: Math.floor((Date.now() - orderDetails.createdAt * 1000) / (1000 * 60 * 60 * 24))
                }
            );

            // Update reputation
            const reputationTx = await this.blockchainService.updateReputation(
                userId,
                reputationAnalysis.reputationChange
            );

            return {
                orderId,
                userId,
                returnReason,
                reputationAnalysis,
                blockchain: {
                    productReturn: blockchainTx,
                    reputationUpdate: reputationTx
                },
                success: true
            };

        } catch (error) {
            console.error('Product return processing failed:', error);
            throw new Error(`Product return processing failed: ${error.message}`);
        }
    }

    /**
     * Process order completion with rewards
     */
    async processOrderCompletion(orderId, userId) {
        try {
            // Mark as completed on blockchain
            const blockchainTx = await this.blockchainService.markOrderCompleted(orderId);

            // Get order details for context
            const orderDetails = await this.blockchainService.getOrder(orderId);

            // Calculate reputation change
            const reputationAnalysis = await this.calculateReputationChange(
                userId,
                'ORDER_COMPLETED',
                {
                    orderValue: orderDetails.orderValue,
                    productCategory: orderDetails.productCategory,
                    destination: orderDetails.destination,
                    daysSincePurchase: Math.floor((Date.now() - orderDetails.createdAt * 1000) / (1000 * 60 * 60 * 24))
                }
            );

            // Update reputation
            const reputationTx = await this.blockchainService.updateReputation(
                userId,
                reputationAnalysis.reputationChange
            );

            return {
                orderId,
                userId,
                reputationAnalysis,
                blockchain: {
                    orderCompletion: blockchainTx,
                    reputationUpdate: reputationTx
                },
                success: true
            };

        } catch (error) {
            console.error('Order completion processing failed:', error);
            throw new Error(`Order completion processing failed: ${error.message}`);
        }
    }

    /**
     * Process positive behavior with rewards
     */
    async processPositiveBehavior(userId, behaviorType, details = {}) {
        try {
            const validBehaviors = ['EARLY_PAYMENT', 'POSITIVE_REVIEW', 'REFERRAL', 'LOYALTY_PROGRAM'];
            if (!validBehaviors.includes(behaviorType)) {
                throw new Error(`Invalid behavior type. Valid: ${validBehaviors.join(', ')}`);
            }

            // Calculate reputation change
            const reputationAnalysis = await this.calculateReputationChange(
                userId,
                behaviorType,
                details
            );

            // Update reputation
            const reputationTx = await this.blockchainService.updateReputation(
                userId,
                reputationAnalysis.reputationChange
            );

            return {
                userId,
                behaviorType,
                details,
                reputationAnalysis,
                blockchain: {
                    reputationUpdate: reputationTx
                },
                success: true
            };

        } catch (error) {
            console.error('Positive behavior processing failed:', error);
            throw new Error(`Positive behavior processing failed: ${error.message}`);
        }
    }

    /**
     * Batch process multiple users for risk assessment
     */
    async batchRiskAssessment(userIds) {
        const results = [];

        for (const userId of userIds.slice(0, 20)) { // Limit to 20 users
            try {
                const userData = await this.blockchainService.getUserData(userId);

                if (userData.totalOrders === 0) {
                    results.push({ userId, status: 'no_data', risk_score: 0 });
                    continue;
                }

                const currentReputation = await this.blockchainService.getUserReputation(userId);
                const riskAssessment = await this.asiClient.predictCustomerRisk(userData);

                results.push({
                    userId,
                    status: 'analyzed',
                    currentReputation,
                    riskAssessment,
                    userData: {
                        totalOrders: userData.totalOrders,
                        returnRate: userData.totalOrders > 0 ?
                            ((userData.returnedOrders / userData.totalOrders) * 100).toFixed(1) + '%' : '0%'
                    }
                });
            } catch (error) {
                results.push({ userId, status: 'error', error: error.message });
            }
        }

        return results;
    }
}

module.exports = ASIReputationEngine;