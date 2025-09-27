// Main AI Reputation Engine
class ASIReputationEngine {
    constructor() {
        this.asiClient = new ASIClient(process.env.ASI_API_KEY);
        this.fallbackEnabled = true;
    }

    async calculateReputationChange(userId, action, actionContext = {}) {
        try {
            // Get user data from blockchain
            const userData = await BlockchainDataService.getUserData(userId);

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

    validateASIResponse(response) {
        if (!response || typeof response.reputation_change !== 'number') {
            throw new Error('Invalid ASI response: missing reputation_change');
        }

        if (response.reputation_change < -100 || response.reputation_change > 100) {
            throw new Error('Invalid ASI response: reputation_change out of bounds');
        }
    }

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
}