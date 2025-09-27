// testReputation.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "your-api-key";

const headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
};

// --- Helper Function ---
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
            console.error(`❌ [${method.toUpperCase()}] ${endpoint}`, error.message);
        }
    }
}

// --- Individual Tests ---
async function testHealth() {
    return callAPI("get", "/health");
}

async function testGetReputation(userIdentifier = "user123") {
    return callAPI("get", `/reputation/${userIdentifier}`);
}

async function testIncreaseReputation(userIdentifier = "user123", points = 10) {
    return callAPI("post", "/reputation/increase", { userIdentifier, points });
}

async function testDecreaseReputation(userIdentifier = "user123", points = 5) {
    return callAPI("post", "/reputation/decrease", { userIdentifier, points });
}

async function testBatchReputation(userIdentifiers = ["user123", "user456"]) {
    return callAPI("post", "/reputation/batch", { userIdentifiers });
}

// --- Full Flow Test ---
async function runFullFlow() {
    console.log("\n🚀 Running Reputation Full Flow Test...\n");

    await testHealth();

    // increase rep
    await testIncreaseReputation("flowUser", 20);

    // get rep after increase
    await testGetReputation("flowUser");

    // decrease rep
    await testDecreaseReputation("flowUser", 10);

    // get rep after decrease
    await testGetReputation("flowUser");

    // batch check
    await testBatchReputation(["flowUser", "anotherUser"]);

    console.log("\n✅ Reputation Full Flow complete.\n");
}

// --- Run Script ---
(async () => {
    const mode = process.argv[2] || "all";

    if (mode === "all") {
        await runFullFlow();
    } else if (mode === "individual") {
        console.log("\n🧪 Running Individual Tests...\n");
        await testHealth();
        await testGetReputation("user123");
        await testIncreaseReputation("user123", 15);
        await testDecreaseReputation("user123", 5);
        await testBatchReputation(["user123", "user456"]);
    } else {
        console.log("Usage: node testReputation.js [all|individual]");
    }
})();
