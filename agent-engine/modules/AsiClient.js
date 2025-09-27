const axios = require('axios');

/**
 * ASI API Client for intelligent decision making
 */
class ASIClient {
    constructor(apiKey, baseURL = 'https://api.asi1.ai') {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }

    /**
     * Make a request to ASI API
     */
    async makeRequest(messages, maxTokens = 1000, temperature = 0.3) {
        try {
            const response = await this.client.post('/v1/chat/completions', {
                model: 'gpt-4',
                messages,
                max_tokens: maxTokens,
                temperature,
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.data.choices[0].message.content);
        } catch (error) {
            console.error('ASI API Error:', error.response?.data || error.message);
            throw new Error(`ASI API failed: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Analyze user behavior for reputation scoring
     */
    async analyzeReputationChange(userData, action, actionContext) {
        const systemPrompt = `You are an expert e-commerce reputation analyst. Analyze user behavior and provide precise reputation score changes. Always respond in valid JSON format with numeric scores between -100 and +100.`;

        const userPrompt = `
        ANALYZE USER BEHAVIOR FOR REPUTATION SCORING:

        USER STATISTICS:
        - Total Orders: ${userData.totalOrders}
        - Completed Orders: ${userData.completedOrders}
        - Returned Orders: ${userData.returnedOrders}
        - Delivery Failures: ${userData.deliveryFailures}
        - Total Order Value: $${userData.totalOrderValue}
        - Average Order Value: $${userData.avgOrderValue}
        
        RECENT BEHAVIOR (last 10 orders):
        ${userData.recentOrders.map((order, i) =>
            `${i + 1}. $${order.orderValue} - ${this.getStatusName(order.status)} - ${order.productCategory} - Destination: ${order.destination}`
        ).join('\n')}

        CURRENT ACTION: ${action}
        ACTION CONTEXT: ${JSON.stringify(actionContext)}

        BEHAVIORAL METRICS:
        - Return Rate: ${userData.totalOrders > 0 ? ((userData.returnedOrders / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Success Rate: ${userData.totalOrders > 0 ? (((userData.totalOrders - userData.deliveryFailures - userData.returnedOrders) / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Average Days Between Orders: ${userData.avgDaysBetweenOrders || 'N/A'}

        SCORING GUIDELINES:
        - Positive actions: +5 to +50 points (purchases, deliveries, keeping products)
        - Negative actions: -5 to -100 points (returns, delivery failures)
        - Consider customer value, behavior patterns, and improvement trends
        - Escalate penalties for repeat problematic behavior
        - Reward loyal customers with good track records

        Respond in this EXACT JSON format:
        {
            "reputation_change": <integer -100 to +100>,
            "confidence": <float 0.0 to 1.0>,
            "customer_tier": "new|bronze|silver|gold|platinum",
            "risk_level": "low|medium|high|critical",
            "primary_factors": ["factor1", "factor2", "factor3"],
            "explanation": "Detailed reasoning for the score",
            "recommendations": ["recommendation1", "recommendation2"]
        }
        `;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        return await this.makeRequest(messages, 1200, 0.2);
    }

    /**
     * Predict customer risk profile
     */
    async predictCustomerRisk(userData) {
        const systemPrompt = `You are an expert at predicting customer risk in e-commerce. Analyze patterns and predict future behavior risks.`;

        const userPrompt = `
        PREDICT CUSTOMER RISK PROFILE:

        CUSTOMER DATA:
        - Total Orders: ${userData.totalOrders}
        - Return Rate: ${userData.totalOrders > 0 ? ((userData.returnedOrders / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Delivery Failure Rate: ${userData.totalOrders > 0 ? ((userData.deliveryFailures / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Average Order Value: $${userData.avgOrderValue}
        - Recent Activity: ${userData.recentOrders.length} orders in last 90 days

        RECENT PATTERN:
        ${userData.recentOrders.slice(-5).map((order, i) =>
            `${i + 1}. $${order.orderValue} - ${this.getStatusName(order.status)} - ${order.destination}`
        ).join('\n')}

        Respond in this EXACT JSON format:
        {
            "risk_score": <integer 0 to 100>,
            "risk_category": "low|medium|high|critical",
            "future_return_probability": <float 0.0 to 1.0>,
            "future_delivery_failure_probability": <float 0.0 to 1.0>,
            "churn_probability": <float 0.0 to 1.0>,
            "warning_signs": ["sign1", "sign2"],
            "recommended_actions": ["action1", "action2"]
        }
        `;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        return await this.makeRequest(messages, 800, 0.3);
    }

    /**
     * Analyze logistic partner allocation
     */
    async analyzeLogisticAllocation(userData, currentReputation, orderDetails, logisticPartners) {
        const systemPrompt = `You are an expert logistics analyst. Analyze customer profile and recommend the best logistic partner based on reputation thresholds and risk factors.`;

        const userPrompt = `
        LOGISTIC PARTNER ALLOCATION ANALYSIS:

        CUSTOMER PROFILE:
        - User ID: ${userData.userId || 'Unknown'}
        - Current Reputation: ${currentReputation}
        - Total Orders: ${userData.totalOrders}
        - Success Rate: ${userData.totalOrders > 0 ? (((userData.totalOrders - userData.deliveryFailures - userData.returnedOrders) / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Return Rate: ${userData.totalOrders > 0 ? ((userData.returnedOrders / userData.totalOrders) * 100).toFixed(1) : 0}%
        - Delivery Failure Rate: ${userData.totalOrders > 0 ? ((userData.deliveryFailures / userData.totalOrders) * 100).toFixed(1) : 0}%

        ORDER DETAILS:
        - Order Value: $${orderDetails.orderValue}
        - Product Category: ${orderDetails.productCategory}
        - Destination: ${orderDetails.destination}

        AVAILABLE LOGISTIC PARTNERS:
        ${logisticPartners.map((partner, i) =>
            `${i + 1}. ${partner.name} - Min Reputation: ${partner.minReputationThreshold} - Max Reputation: ${partner.maxReputationThreshold || 'No limit'} - Service Areas: ${partner.serviceAreas?.join(', ') || 'All'}`
        ).join('\n')}

        ALLOCATION CRITERIA:
        - Customer reputation should match partner's preferred reputation range
        - Consider partner's service capabilities and areas
        - Factor in customer risk profile
        - Optimize for successful delivery probability

        Respond in this EXACT JSON format:
        {
            "recommended_partner": "partner_name",
            "partner_id": "partner_id",
            "confidence": <float 0.0 to 1.0>,
            "reasoning": ["reason1", "reason2", "reason3"],
            "risk_mitigation": ["mitigation1", "mitigation2"],
            "alternative_partners": ["partner1", "partner2"],
            "delivery_success_probability": <float 0.0 to 1.0>
        }
        `;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        return await this.makeRequest(messages, 1000, 0.3);
    }

    /**
     * Get human-readable status name
     */
    getStatusName(status) {
        const names = ['CREATED', 'PAID', 'SHIPPED', 'DELIVERED', 'RETURNED', 'DELIVERY_FAILED', 'COMPLETED', 'CANCELLED'];
        return names[status] || 'UNKNOWN';
    }
}

module.exports = ASIClient;