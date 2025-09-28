#!/usr/bin/env node

/**
 * Comprehensive Logistics System Test Script
 * 
 * Test Flow:
 * 1. Create logistic partners first
 * 2. Create orders with different scenarios
 * 3. Test various delivery cases (success, failure, return, etc.)
 * 4. Generate analytics and performance reports
 */

const axios = require('axios');
require('dotenv').config();

class LogisticsTestRunner {
    constructor() {
        this.baseURL = process.env.TEST_BASE_URL || 'http://localhost:3001';
        this.apiKey = process.env.AI_API_KEY || 'test-api-key';
        this.testData = {
            partners: [],
            orders: [],
            allocations: [],
            users: []
        };
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    // Utility methods
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            error: '\x1b[31m',   // Red
            warning: '\x1b[33m', // Yellow
            reset: '\x1b[0m'     // Reset
        };
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async makeRequest(method, endpoint, data = null) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status
            };
        }
    }

    recordTest(testName, passed, details = null) {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
            this.log(`✅ PASS: ${testName}`, 'success');
        } else {
            this.testResults.failed++;
            this.log(`❌ FAIL: ${testName} - ${details}`, 'error');
        }

        this.testResults.details.push({
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Phase 1: Create Logistics Partners
    async createLogisticsPartners() {
        this.log('🏢 Phase 1: Creating Logistics Partners', 'info');

        const partnersData = [
            {
                name: 'Premium Express Logistics',
                serviceAreas: ['mumbai', 'delhi', 'bangalore'],
                email: 'contact@premiumexpress.com',
                phone: '+91-9876543210',
                address: '123 Premium Hub, Mumbai',
                dailyOrderLimit: 200,
                maxOrderValue: 50000,
                minOrderValue: 1000,
                minReputationThreshold: 80,
                maxReputationThreshold: 100,
                preferredCategories: ['electronics', 'fashion', 'luxury'],
                deliveryTypes: ['express', 'same-day', 'premium'],
                workingHours: { start: '08:00', end: '22:00', timezone: 'IST' }
            },
            {
                name: 'Standard Delivery Solutions',
                serviceAreas: ['delhi', 'pune', 'hyderabad', 'jaipur'],
                email: 'ops@standarddelivery.com',
                phone: '+91-9876543211',
                address: '456 Standard Plaza, Delhi',
                dailyOrderLimit: 500,
                maxOrderValue: 25000,
                minOrderValue: 100,
                minReputationThreshold: 40,
                maxReputationThreshold: 79,
                preferredCategories: ['books', 'home', 'sports'],
                deliveryTypes: ['standard', 'express'],
                workingHours: { start: '09:00', end: '20:00', timezone: 'IST' }
            },
            {
                name: 'Budget Freight Network',
                serviceAreas: ['kolkata', 'chennai', 'ahmedabad', 'kochi'],
                email: 'support@budgetfreight.com',
                phone: '+91-9876543212',
                address: '789 Budget Center, Kolkata',
                dailyOrderLimit: 1000,
                maxOrderValue: 15000,
                minOrderValue: 50,
                minReputationThreshold: 0,
                maxReputationThreshold: 39,
                preferredCategories: ['grocery', 'household', 'pharmacy'],
                deliveryTypes: ['standard', 'economy'],
                workingHours: { start: '10:00', end: '18:00', timezone: 'IST' }
            },
            {
                name: 'All-India Logistics Network',
                serviceAreas: [], // Serves all areas
                email: 'info@allindia.com',
                phone: '+91-9876543213',
                address: '101 National Highway, Gurgaon',
                dailyOrderLimit: 300,
                maxOrderValue: 100000,
                minOrderValue: 500,
                minReputationThreshold: 60,
                preferredCategories: ['automotive', 'industrial', 'heavy-machinery'],
                deliveryTypes: ['standard', 'express', 'freight', 'specialized']
            },
            {
                name: 'Quick Local Delivery',
                serviceAreas: ['mumbai', 'bangalore'],
                email: 'hello@quicklocal.com',
                phone: '+91-9876543214',
                address: '202 Local Hub, Bangalore',
                dailyOrderLimit: 150,
                maxOrderValue: 5000,
                minOrderValue: 10,
                minReputationThreshold: 20,
                maxReputationThreshold: 60,
                preferredCategories: ['food', 'medicines', 'documents'],
                deliveryTypes: ['same-day', 'hyperlocal']
            }
        ];

        for (let i = 0; i < partnersData.length; i++) {
            const partnerData = partnersData[i];
            const response = await this.makeRequest('POST', '/logistics/partners', partnerData);

            if (response.success && response.data.success) {
                this.testData.partners.push({
                    id: response.data.data.partnerId,
                    name: partnerData.name,
                    ...response.data.data.partner
                });
                this.recordTest(`Create Partner: ${partnerData.name}`, true);
                this.log(`   Created: ${partnerData.name} (ID: ${response.data.data.partnerId})`);
            } else {
                this.recordTest(`Create Partner: ${partnerData.name}`, false, response.error?.error || 'Unknown error');
            }

            await this.delay(500); // Small delay between partner creations
        }

        // Verify partners were created
        const getPartnersResponse = await this.makeRequest('GET', '/logistics/partners');
        if (getPartnersResponse.success && getPartnersResponse.data.count >= partnersData.length) {
            this.recordTest('Verify Partners Created', true);
            this.log(`   Total active partners: ${getPartnersResponse.data.count}`);
        } else {
            this.recordTest('Verify Partners Created', false, 'Partner count mismatch');
        }
    }

    // Phase 2: Create Orders
    async createOrders() {
        this.log('📦 Phase 2: Creating Orders with Different Scenarios', 'info');

        const orderScenarios = [
            // High reputation user orders
            {
                userId: 'user_premium_001',
                userReputation: 95,
                orderValue: 45000,
                productCategory: 'electronics',
                destination: 'mumbai',
                description: 'High-value electronics order - Premium user'
            },
            {
                userId: 'user_premium_002',
                userReputation: 88,
                orderValue: 25000,
                productCategory: 'fashion',
                destination: 'bangalore',
                description: 'Fashion order - Premium user'
            },

            // Medium reputation user orders
            {
                userId: 'user_standard_001',
                userReputation: 65,
                orderValue: 8500,
                productCategory: 'books',
                destination: 'delhi',
                description: 'Books order - Standard user'
            },
            {
                userId: 'user_standard_002',
                userReputation: 55,
                orderValue: 12000,
                productCategory: 'home',
                destination: 'pune',
                description: 'Home goods - Standard user'
            },
            {
                userId: 'user_standard_003',
                userReputation: 70,
                orderValue: 18000,
                productCategory: 'sports',
                destination: 'hyderabad',
                description: 'Sports equipment - Standard user'
            },

            // Low reputation user orders
            {
                userId: 'user_budget_001',
                userReputation: 25,
                orderValue: 750,
                productCategory: 'grocery',
                destination: 'kolkata',
                description: 'Grocery order - Budget user'
            },
            {
                userId: 'user_budget_002',
                userReputation: 15,
                orderValue: 300,
                productCategory: 'household',
                destination: 'chennai',
                description: 'Household items - Budget user'
            },

            // Special cases
            {
                userId: 'user_local_001',
                userReputation: 45,
                orderValue: 150,
                productCategory: 'food',
                destination: 'mumbai',
                description: 'Quick food delivery - Local service'
            },
            {
                userId: 'user_industrial_001',
                userReputation: 85,
                orderValue: 75000,
                productCategory: 'automotive',
                destination: 'bangalore',
                description: 'Industrial/Automotive - Specialized delivery'
            },
            {
                userId: 'user_mixed_001',
                userReputation: 50,
                orderValue: 5500,
                productCategory: 'electronics',
                destination: 'jaipur',
                description: 'Mid-range electronics - Mixed scenario'
            }
        ];

        for (let i = 0; i < orderScenarios.length; i++) {
            const scenario = orderScenarios[i];
            const customOrderId = `TEST_ORDER_${Date.now()}_${i.toString().padStart(2, '0')}`;

            const orderData = {
                userId: scenario.userId,
                orderValue: scenario.orderValue,
                productCategory: scenario.productCategory,
                destination: scenario.destination,
                customOrderId
            };

            const response = await this.makeRequest('POST', '/orders/create', orderData);

            if (response.success && response.data.success) {
                const orderInfo = {
                    orderId: customOrderId,
                    allocationId: response.data.allocationId,
                    userId: scenario.userId,
                    userReputation: scenario.userReputation,
                    partnerId: response.data.logisticAllocation.partnerId,
                    partnerName: response.data.logisticAllocation.recommendedPartner,
                    allocationMethod: response.data.logisticAllocation.allocationMethod,
                    confidence: response.data.logisticAllocation.confidence,
                    deliverySuccessProbability: response.data.logisticAllocation.deliverySuccessProbability,
                    status: 'allocated',
                    scenario: scenario.description,
                    ...orderData
                };

                this.testData.orders.push(orderInfo);
                this.testData.allocations.push({
                    id: response.data.allocationId,
                    orderId: customOrderId,
                    ...orderInfo
                });

                if (!this.testData.users.includes(scenario.userId)) {
                    this.testData.users.push(scenario.userId);
                }

                this.recordTest(`Create Order: ${customOrderId}`, true);
                this.log(`   Order: ${customOrderId} → ${response.data.logisticAllocation.recommendedPartner}`);
                this.log(`   Confidence: ${response.data.logisticAllocation.confidence}, Success Probability: ${response.data.logisticAllocation.deliverySuccessProbability}`);
            } else {
                this.recordTest(`Create Order: ${customOrderId}`, false, response.error?.error || 'Unknown error');
            }

            await this.delay(800); // Delay between order creations
        }

        this.log(`   Created ${this.testData.orders.length} orders across ${this.testData.users.length} users`);
    }

    // Phase 3: Test Order Lifecycle - In Transit
    async testInTransitScenarios() {
        this.log('🚛 Phase 3: Testing In-Transit Scenarios', 'info');

        // Move 60% of orders to in-transit
        const ordersToTransit = this.testData.orders.slice(0, Math.ceil(this.testData.orders.length * 0.6));

        for (const order of ordersToTransit) {
            const transitData = {
                userId: order.userId,
                estimatedDeliveryTime: new Date(Date.now() + (24 + Math.random() * 48) * 60 * 60 * 1000).toISOString(),
                trackingInfo: `TRK${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`,
                carrierInfo: `${order.partnerName} - Vehicle: ${['TRK001', 'VAN002', 'BIKE003'][Math.floor(Math.random() * 3)]}`
            };

            const response = await this.makeRequest('PUT', `/orders/${order.orderId}/in-transit`, transitData);

            if (response.success && response.data.success) {
                order.status = 'in_transit';
                order.trackingInfo = transitData.trackingInfo;
                order.estimatedDeliveryTime = transitData.estimatedDeliveryTime;

                this.recordTest(`In-Transit: ${order.orderId}`, true);
                this.log(`   Order ${order.orderId} is now in transit (${transitData.trackingInfo})`);
            } else {
                this.recordTest(`In-Transit: ${order.orderId}`, false, response.error?.error || 'Unknown error');
            }

            await this.delay(300);
        }
    }

    // Phase 4: Test Successful Deliveries
    async testSuccessfulDeliveries() {
        this.log('✅ Phase 4: Testing Successful Delivery Scenarios', 'info');

        // Successfully deliver 50% of orders
        const ordersToDeliver = this.testData.orders
            .filter(o => ['allocated', 'in_transit'].includes(o.status))
            .slice(0, Math.ceil(this.testData.orders.length * 0.5));

        for (const order of ordersToDeliver) {
            const deliveryData = {
                userId: order.userId,
                customerRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, // 3.5 to 5.0
                partnerRating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10, // 3.8 to 5.0
                comments: this.generateDeliveryComments('success'),
                deliveryTime: new Date().toISOString(),
                deliveryProof: `PROOF_${Date.now()}_${Math.random().toString(36).substring(7)}`
            };

            const response = await this.makeRequest('POST', `/orders/${order.orderId}/delivery-success`, deliveryData);

            if (response.success && response.data.success) {
                order.status = 'delivered';
                order.customerRating = deliveryData.customerRating;
                order.partnerRating = deliveryData.partnerRating;
                order.deliveryComments = deliveryData.comments;
                order.actualDeliveryTime = deliveryData.deliveryTime;

                this.recordTest(`Successful Delivery: ${order.orderId}`, true);
                this.log(`   Order ${order.orderId} delivered successfully (Rating: ${deliveryData.customerRating}/5.0)`);
            } else {
                this.recordTest(`Successful Delivery: ${order.orderId}`, false, response.error?.error || 'Unknown error');
            }

            await this.delay(400);
        }
    }

    // Phase 5: Test Delivery Failures
    async testDeliveryFailures() {
        this.log('❌ Phase 5: Testing Delivery Failure Scenarios', 'info');

        const failureReasons = [
            'Customer unavailable after 3 attempts',
            'Incorrect address provided',
            'Customer refused delivery',
            'Payment issues at delivery',
            'Product damaged during transit',
            'Security issues at delivery location',
            'Customer requested reschedule multiple times'
        ];

        // Fail 25% of remaining orders
        const ordersToFail = this.testData.orders
            .filter(o => ['allocated', 'in_transit'].includes(o.status))
            .slice(0, Math.ceil(this.testData.orders.length * 0.25));

        for (const order of ordersToFail) {
            const failureData = {
                userId: order.userId,
                reason: failureReasons[Math.floor(Math.random() * failureReasons.length)],
                attemptCount: Math.floor(Math.random() * 4) + 1, // 1-4 attempts
                failureTimestamp: new Date().toISOString(),
                nextAttemptScheduled: Math.random() > 0.7 ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
            };

            const response = await this.makeRequest('POST', `/orders/${order.orderId}/delivery-failed`, failureData);

            if (response.success && response.data.success) {
                order.status = 'failed';
                order.failureReason = failureData.reason;
                order.attemptCount = failureData.attemptCount;
                order.failureTimestamp = failureData.failureTimestamp;

                this.recordTest(`Failed Delivery: ${order.orderId}`, true);
                this.log(`   Order ${order.orderId} delivery failed: ${failureData.reason} (${failureData.attemptCount} attempts)`);
            } else {
                this.recordTest(`Failed Delivery: ${order.orderId}`, false, response.error?.error || 'Unknown error');
            }

            await this.delay(350);
        }
    }

    // Phase 6: Test Returns
    async testReturnScenarios() {
        this.log('🔄 Phase 6: Testing Return Scenarios', 'info');

        const returnReasons = [
            'Product not as described',
            'Product damaged on arrival',
            'Customer changed mind',
            'Wrong product delivered',
            'Quality issues',
            'Size/fit issues',
            'Defective product'
        ];

        // Return 15% of remaining orders
        const ordersToReturn = this.testData.orders
            .filter(o => ['allocated', 'in_transit'].includes(o.status))
            .slice(0, Math.ceil(this.testData.orders.length * 0.15));

        for (const order of ordersToReturn) {
            const returnData = {
                status: 'returned',
                additionalData: {
                    returnReason: returnReasons[Math.floor(Math.random() * returnReasons.length)],
                    returnDate: new Date().toISOString(),
                    refundStatus: ['processed', 'pending', 'approved'][Math.floor(Math.random() * 3)],
                    returnPickupScheduled: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    customerInitiated: Math.random() > 0.3,
                    refundAmount: order.orderValue * (Math.random() * 0.2 + 0.8) // 80-100% refund
                }
            };

            const response = await this.makeRequest('PUT', `/logistics/allocations/${order.allocationId}/status`, returnData);

            if (response.success && response.data.success) {
                order.status = 'returned';
                order.returnReason = returnData.additionalData.returnReason;
                order.refundStatus = returnData.additionalData.refundStatus;
                order.returnDate = returnData.additionalData.returnDate;

                this.recordTest(`Return Processing: ${order.orderId}`, true);
                this.log(`   Order ${order.orderId} returned: ${returnData.additionalData.returnReason} (Refund: ${returnData.additionalData.refundStatus})`);
            } else {
                this.recordTest(`Return Processing: ${order.orderId}`, false, response.error?.error || 'Unknown error');
            }

            await this.delay(300);
        }
    }

    // Phase 7: Update Partner Performance
    async updatePartnerPerformance() {
        this.log('📊 Phase 7: Updating Partner Performance Metrics', 'info');

        for (const partner of this.testData.partners) {
            const partnerOrders = this.testData.orders.filter(o => o.partnerId === partner.id);

            if (partnerOrders.length === 0) continue;

            const deliveredOrders = partnerOrders.filter(o => o.status === 'delivered');
            const successRate = partnerOrders.length > 0 ? (deliveredOrders.length / partnerOrders.length) * 100 : 0;

            const avgRating = deliveredOrders.length > 0
                ? deliveredOrders.reduce((sum, o) => sum + (o.customerRating || 0), 0) / deliveredOrders.length
                : 0;

            const avgDeliveryTime = Math.floor(Math.random() * 20) + 12; // 12-32 hours

            const performanceData = {
                successRate: Math.round(successRate * 10) / 10,
                avgDeliveryTime: avgDeliveryTime,
                customerRating: Math.round(avgRating * 10) / 10,
                totalOrdersHandled: partnerOrders.length + Math.floor(Math.random() * 50) // Add some historical data
            };

            const response = await this.makeRequest('PUT', `/logistics/partners/${partner.id}/performance`, performanceData);

            if (response.success && response.data.success) {
                partner.currentPerformance = performanceData;
                this.recordTest(`Update Performance: ${partner.name}`, true);
                this.log(`   ${partner.name}: ${performanceData.successRate}% success, ${performanceData.customerRating}/5.0 rating`);
            } else {
                this.recordTest(`Update Performance: ${partner.name}`, false, response.error?.error || 'Unknown error');
            }

            await this.delay(200);
        }
    }

    // Phase 8: Generate Analytics and Reports
    async generateAnalytics() {
        this.log('📈 Phase 8: Generating Analytics and Reports', 'info');

        // System Analytics
        const systemResponse = await this.makeRequest('GET', '/logistics/analytics?days=30');
        if (systemResponse.success && systemResponse.data.success) {
            this.recordTest('System Analytics Generation', true);
            const analytics = systemResponse.data.data;
            this.log(`   Total Allocations: ${analytics.totalAllocations}`);
            this.log(`   Avg Confidence: ${analytics.averageConfidence}`);
            this.log(`   Avg Success Probability: ${analytics.averageDeliverySuccessProbability}`);
            this.log(`   Status Distribution: ${JSON.stringify(analytics.statusDistribution)}`);
        } else {
            this.recordTest('System Analytics Generation', false, systemResponse.error?.error);
        }

        // Dashboard Data
        const dashboardResponse = await this.makeRequest('GET', '/logistics/dashboard?days=7');
        if (dashboardResponse.success && dashboardResponse.data.success) {
            this.recordTest('Dashboard Data Generation', true);
            const dashboard = dashboardResponse.data.data;
            this.log(`   Active Partners: ${dashboard.activePartnersCount}`);
            this.log(`   Top Performers: ${dashboard.topPerformers.length}`);
        } else {
            this.recordTest('Dashboard Data Generation', false, dashboardResponse.error?.error);
        }

        // Individual Partner Performance
        for (const partner of this.testData.partners.slice(0, 3)) { // Test first 3 partners
            const perfResponse = await this.makeRequest('GET', `/logistics/partners/${partner.id}/performance?days=30`);
            if (perfResponse.success && perfResponse.data.success) {
                this.recordTest(`Partner Analytics: ${partner.name}`, true);
                const perf = perfResponse.data.data;
                this.log(`   ${partner.name} - Success Rate: ${perf.successRate}, Avg Delivery: ${perf.avgDeliveryTime}`);
            } else {
                this.recordTest(`Partner Analytics: ${partner.name}`, false, perfResponse.error?.error);
            }
        }
    }

    // Phase 9: Test Edge Cases and Bulk Operations
    async testEdgeCases() {
        this.log('🔧 Phase 9: Testing Edge Cases and Bulk Operations', 'info');

        // Test bulk partner status update
        const partnerIds = this.testData.partners.slice(0, 2).map(p => p.id);
        const bulkResponse = await this.makeRequest('PUT', '/logistics/partners/bulk/status', {
            partnerIds: partnerIds,
            status: 'maintenance'
        });

        if (bulkResponse.success && bulkResponse.data.success) {
            this.recordTest('Bulk Partner Status Update', true);
            this.log(`   Updated ${partnerIds.length} partners to maintenance mode`);

            // Reactivate them
            await this.delay(1000);
            const reactivateResponse = await this.makeRequest('PUT', '/logistics/partners/bulk/status', {
                partnerIds: partnerIds,
                status: 'active'
            });

            if (reactivateResponse.success) {
                this.log(`   Reactivated ${partnerIds.length} partners`);
            }
        } else {
            this.recordTest('Bulk Partner Status Update', false, bulkResponse.error?.error);
        }

        // Test health check
        const healthResponse = await this.makeRequest('GET', '/logistics/health');
        if (healthResponse.success && healthResponse.data.success) {
            this.recordTest('System Health Check', true);
            this.log(`   System health: ${healthResponse.data.message}`);
        } else {
            this.recordTest('System Health Check', false, healthResponse.error?.error);
        }

        // Test invalid requests
        const invalidResponse = await this.makeRequest('GET', '/logistics/allocations/invalid_id');
        if (!invalidResponse.success && invalidResponse.status === 404) {
            this.recordTest('Error Handling - Invalid Allocation', true);
            this.log(`   Correctly handled invalid allocation ID`);
        } else {
            this.recordTest('Error Handling - Invalid Allocation', false, 'Should have returned 404');
        }
    }

    // Utility method to generate realistic delivery comments
    generateDeliveryComments(type) {
        const successComments = [
            'Excellent service, on-time delivery',
            'Package well protected, professional delivery',
            'Fast and efficient delivery',
            'Friendly delivery person, smooth experience',
            'Great communication throughout the process',
            'Perfect condition, exactly as expected'
        ];

        const failureComments = [
            'Multiple delivery attempts failed',
            'Customer communication issues',
            'Address verification problems',
            'Delivery location access issues',
            'Product condition concerns'
        ];

        const comments = type === 'success' ? successComments : failureComments;
        const numComments = Math.floor(Math.random() * 3) + 1; // 1-3 comments

        return Array.from({ length: numComments }, () =>
            comments[Math.floor(Math.random() * comments.length)]
        );
    }

    // Generate comprehensive test report
    generateReport() {
        this.log('📋 Generating Comprehensive Test Report', 'info');

        const report = {
            testSummary: {
                totalTests: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: `${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`,
                executionTime: Date.now() - this.startTime,
                timestamp: new Date().toISOString()
            },
            dataCreated: {
                partners: this.testData.partners.length,
                orders: this.testData.orders.length,
                users: this.testData.users.length,
                allocations: this.testData.allocations.length
            },
            orderStatusDistribution: this.testData.orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {}),
            partnerUtilization: this.testData.partners.map(partner => ({
                name: partner.name,
                ordersHandled: this.testData.orders.filter(o => o.partnerId === partner.id).length,
                successfulDeliveries: this.testData.orders.filter(o => o.partnerId === partner.id && o.status === 'delivered').length
            })),
            failedTests: this.testResults.details.filter(t => !t.passed),
            recommendations: this.generateRecommendations()
        };

        console.log('\n' + '='.repeat(80));
        console.log('📊 LOGISTICS SYSTEM TEST REPORT');
        console.log('='.repeat(80));
        console.log(`🎯 Test Summary: ${report.testSummary.passed}/${report.testSummary.totalTests} passed (${report.testSummary.successRate})`);
        console.log(`⏱️  Execution Time: ${(report.testSummary.executionTime / 1000).toFixed(2)} seconds`);
        console.log(`📦 Data Created: ${report.dataCreated.partners} partners, ${report.dataCreated.orders} orders, ${report.dataCreated.users} users`);

        console.log('\n📈 Order Status Distribution:');
        Object.entries(report.orderStatusDistribution).forEach(([status, count]) => {
            const percentage = ((count / report.dataCreated.orders) * 100).toFixed(1);
            console.log(`   ${status}: ${count} orders (${percentage}%)`);
        });

        console.log('\n🏢 Partner Utilization:');
        report.partnerUtilization.forEach(partner => {
            const successRate = partner.ordersHandled > 0 ?
                ((partner.successfulDeliveries / partner.ordersHandled) * 100).toFixed(1) : '0';
            console.log(`   ${partner.name}: ${partner.ordersHandled} orders, ${partner.successfulDeliveries} delivered (${successRate}%)`);
        });

        if (report.failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            report.failedTests.forEach(test => {
                console.log(`   - ${test.test}: ${test.details}`);
            });
        }

        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   - ${rec}`));
        console.log('='.repeat(80));

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        const successRate = (this.testResults.passed / this.testResults.total) * 100;

        if (successRate < 90) {
            recommendations.push('System reliability needs improvement - success rate below 90%');
        }

        const deliveredCount = this.testData.orders.filter(o => o.status === 'delivered').length;
        const deliveryRate = (deliveredCount / this.testData.orders.length) * 100;

        if (deliveryRate < 50) {
            recommendations.push('Low delivery success rate - investigate partner performance and allocation logic');
        }

        const failedCount = this.testData.orders.filter(o => o.status === 'failed').length;
        if (failedCount > this.testData.orders.length * 0.3) {
            recommendations.push('High failure rate detected - review delivery processes and customer communication');
        }

        const underutilizedPartners = this.testData.partners.filter(partner =>
            this.testData.orders.filter(o => o.partnerId === partner.id).length === 0
        );

        if (underutilizedPartners.length > 0) {
            recommendations.push(`${underutilizedPartners.length} partners received no orders - review allocation algorithm`);
        }

        if (this.testResults.failed > 0) {
            recommendations.push('Address failed test cases to ensure system reliability');
        }

        if (recommendations.length === 0) {
            recommendations.push('All systems performing well - continue monitoring');
            recommendations.push('Consider implementing additional edge case testing');
            recommendations.push('Monitor partner performance trends over longer periods');
        }

        return recommendations;
    }

    // Main test execution method
    async runTests() {
        this.startTime = Date.now();
        this.log('🚀 Starting Comprehensive Logistics System Test', 'info');
        this.log(`📡 Testing against: ${this.baseURL}`, 'info');
        this.log('📋 Test Flow: Partners → Orders → Various Delivery Scenarios → Analytics', 'info');

        try {
            // Phase 1: Create logistics partners first
            // await this.createLogisticsPartners();
            // await this.delay(2000);

            // Phase 2: Create orders with different scenarios  
            await this.createOrders();
            await this.delay(2000);

            // Phase 3: Move orders to in-transit
            await this.testInTransitScenarios();
            await this.delay(1500);

            // Phase 4: Test successful deliveries
            await this.testSuccessfulDeliveries();
            await this.delay(1500);

            // Phase 5: Test delivery failures
            await this.testDeliveryFailures();
            await this.delay(1500);

            // Phase 6: Test return scenarios
            await this.testReturnScenarios();
            await this.delay(1500);

            // Phase 7: Update partner performance
            await this.updatePartnerPerformance();
            await this.delay(1000);

            // Phase 8: Generate analytics
            await this.generateAnalytics();
            await this.delay(1000);

            // Phase 9: Test edge cases
            await this.testEdgeCases();

            // Generate final report
            const report = this.generateReport();

            // Save report to file (optional)
            if (process.env.SAVE_REPORT === 'true') {
                const fs = require('fs');
                const reportPath = `./test-report-${Date.now()}.json`;
                fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
                this.log(`📄 Test report saved to: ${reportPath}`, 'success');
            }

            // Exit with appropriate code
            if (this.testResults.failed === 0) {
                this.log('🎉 All tests completed successfully!', 'success');
                process.exit(0);
            } else {
                this.log(`⚠️  Tests completed with ${this.testResults.failed} failures`, 'warning');
                process.exit(1);
            }

        } catch (error) {
            this.log(`💥 Test execution failed: ${error.message}`, 'error');
            console.error(error);
            process.exit(1);
        }
    }
}

// Command line execution
if (require.main === module) {
    const testRunner = new LogisticsTestRunner();

    // Handle command line arguments
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🚀 Logistics System Test Script

Usage: node logistics-test.js [options]

Options:
  --help, -h              Show this help message
  --base-url <url>        Set base URL (default: http://localhost:3001)
  --api-key <key>         Set API key (default: from env or test-api-key)
  --save-report           Save test report to JSON file
  --no-delays             Skip delays between tests (faster execution)
  --verbose               Enable verbose logging

Environment Variables:
  TEST_BASE_URL          Base URL for API testing
  AI_API_KEY            API key for authentication
  SAVE_REPORT           Set to 'true' to save report
  SUPPRESS_TEST_LOGS    Set to 'true' to reduce logging

Examples:
  node logistics-test.js
  node logistics-test.js --base-url http://localhost:3001 --save-report
  TEST_BASE_URL=http://staging.example.com node logistics-test.js
        `);
        process.exit(0);
    }

    // Parse command line options
    if (args.includes('--base-url')) {
        const urlIndex = args.indexOf('--base-url') + 1;
        if (urlIndex < args.length) {
            testRunner.baseURL = args[urlIndex];
        }
    }

    if (args.includes('--api-key')) {
        const keyIndex = args.indexOf('--api-key') + 1;
        if (keyIndex < args.length) {
            testRunner.apiKey = args[keyIndex];
        }
    }

    if (args.includes('--save-report')) {
        process.env.SAVE_REPORT = 'true';
    }

    if (args.includes('--verbose')) {
        process.env.VERBOSE_LOGGING = 'true';
    }

    // Start test execution
    testRunner.runTests().catch(error => {
        console.error('💥 Fatal error during test execution:', error);
        process.exit(1);
    });
}

module.exports = LogisticsTestRunner;