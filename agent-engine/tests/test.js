// test.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_BASE = process.env.API_BASE || "http://localhost:3001";
const API_KEY = process.env.API_KEY || "your-api-key";

const headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
};

// --- Helper Functions ---
async function callAPI(method, endpoint, data) {
    try {
        const res = await axios({
            method,
            url: `${API_BASE}${endpoint}`,
            headers,
            data,
            timeout: 15000,
        });
        console.log(`✅ [${method.toUpperCase()}] ${endpoint}`, res.data);
        return res.data;
    } catch (error) {
        if (error.response) {
            console.error(
                `❌ [${method.toUpperCase()}] ${endpoint}`,
                error.response.data
            );
        } else {
            console.error(
                `❌ [${method.toUpperCase()}] ${endpoint}`,
                error.message
            );
        }
    }
}

// --- Individual Tests ---
async function testHealth() {
    return callAPI("get", "/health");
}

async function testAddPartner(payload) {
    const body =
        payload || {
            name: "Express Delivery Co",
            minReputationThreshold: 80,
            serviceAreas: ["mumbai", "pune", "delhi"],
            dailyOrderLimit: 150,
        };

    return callAPI("post", "/logistics/partners", body);
}

async function testGetPartners() {
    return callAPI("get", "/logistics/partners");
}

async function testCreateOrder(userId = "user123") {
    const body = {
        userId,
        orderValue: 299.99,
        productCategory: "electronics",
        destination: "Mumbai, Maharashtra",
    };
    return callAPI("post", "/orders/create", body);
}

async function testDeliveryFailed(orderId = "order456", userId = "user123") {
    const body = {
        userId,
        reason: "absent",
        attemptCount: 2,
    };
    return callAPI("post", `/orders/${orderId}/delivery-failed`, body);
}

async function testOrderComplete(orderId, userId = "user123") {
    return callAPI("post", `/orders/${orderId}/complete`, { userId });
}

async function testUserAnalytics(userId = "user123") {
    return callAPI("get", `/analytics/${userId}`);
}

async function testASIConsult(userId = "user123") {
    return callAPI("post", "/asi/consult", {
        userId,
        question: "What is the risk profile of this customer?",
    });
}

// --- Full Flow Test ---
async function runFullFlow() {
    console.log("\n🚀 Running Full Flow Test...\n");
    await testHealth();

    await testAddPartner();
    await testGetPartners();

    const order = await testCreateOrder("flowUser");
    const orderId = order?.orderId || order?.id || "order-temp";

    await testDeliveryFailed(orderId, "flowUser");
    await testOrderComplete(orderId, "flowUser");
    await testUserAnalytics("flowUser");
    await testASIConsult("flowUser");

    console.log("\n✅ Full flow complete.\n");
}

// --- Run Script ---
(async () => {
    const mode = process.argv[2] || "all";

    if (mode === "all") {
        await runFullFlow();
    } else if (mode === "individual") {
        console.log("\n🧪 Running Individual Tests...\n");
        await testHealth();
        await testAddPartner();
        await testGetPartners();
        const order = await testCreateOrder();
        if (order?.orderId || order?.id) {
            const id = order.orderId || order.id;
            await testDeliveryFailed(id);
            await testOrderComplete(id);
        } else {
            console.warn("⚠️ No orderId returned — skipping delivery/complete steps.");
        }
        await testUserAnalytics();
        await testASIConsult();
    } else {
        console.log("Usage: node test.js [all|individual]");
    }
})();
