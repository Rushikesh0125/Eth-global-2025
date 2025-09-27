// test.ts
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
dotenv.config();

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

const API_BASE = process.env.API_BASE ?? "http://localhost:3001";
const API_KEY = process.env.API_KEY ?? "your-api-key";

const headers: Record<string, string> = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
};

// Generic API caller with typed response
async function callAPI<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown
): Promise<T | undefined> {
    try {
        const res = await axios.request<T>({
            method,
            url: `${API_BASE}${endpoint}`,
            headers,
            data,
            timeout: 15_000,
        });
        console.log(`✅ [${method.toUpperCase()}] ${endpoint}`, res.data);
        return res.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const err = error as AxiosError;
            console.error(
                `❌ [${method.toUpperCase()}] ${endpoint}`,
                err.response?.data ?? err.message
            );
        } else {
            console.error(`❌ [${method.toUpperCase()}] ${endpoint}`, String(error));
        }
        return undefined;
    }
}

/* --------------------------
   Minimal typed payloads/responses
   (adapt fields to match your API)
   -------------------------- */
interface PartnerPayload {
    name: string;
    minReputationThreshold: number;
    serviceAreas: string[];
    dailyOrderLimit: number;
    [k: string]: any;
}

interface PartnerResponse {
    id?: string;
    partnerId?: string;
    name?: string;
    [k: string]: any;
}

interface OrderPayload {
    userId: string;
    orderValue: number;
    productCategory: string;
    destination: string;
    [k: string]: any;
}

interface OrderResponse {
    orderId?: string;
    id?: string;
    allocation?: any;
    [k: string]: any;
}

/* --------------------------
   Individual tests
   -------------------------- */
async function testHealth() {
    return callAPI<{ status?: string }>("get", "/health");
}

async function testAddPartner(payload?: PartnerPayload) {
    const body: PartnerPayload =
        payload ??
        ({
            name: "Express Delivery Co",
            minReputationThreshold: 80,
            serviceAreas: ["mumbai", "pune", "delhi"],
            dailyOrderLimit: 150,
        } as PartnerPayload);

    return callAPI<PartnerResponse>("post", "/logistics/partners", body);
}

async function testGetPartners() {
    return callAPI<PartnerResponse[]>("get", "/logistics/partners");
}

async function testCreateOrder(userId = "user123") {
    const body: OrderPayload = {
        userId,
        orderValue: 299.99,
        productCategory: "electronics",
        destination: "Mumbai, Maharashtra",
    };
    return callAPI<OrderResponse>("post", "/orders/create", body);
}

async function testDeliveryFailed(orderId = "order456", userId = "user123") {
    const body = {
        userId,
        reason: "absent",
        attemptCount: 2,
    };
    return callAPI("post", `/orders/${orderId}/delivery-failed`, body);
}

async function testOrderComplete(orderId: string, userId = "user123") {
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

/* --------------------------
   Full flow test
   -------------------------- */
async function runFullFlow() {
    console.log("\n🚀 Running Full Flow Test...\n");
    await testHealth();

    const partner = await testAddPartner();
    await testGetPartners();

    const order = await testCreateOrder("flowUser");
    const orderId =
        order?.orderId ?? order?.id ?? (Math.random() > 0.5 ? "order-temp-1" : "order-temp-2");

    // Use the returned orderId if available — otherwise continue with a fallback
    await testDeliveryFailed(orderId, "flowUser");
    await testOrderComplete(orderId, "flowUser");
    await testUserAnalytics("flowUser");
    await testASIConsult("flowUser");

    console.log("\n✅ Full flow complete.\n");
}

/* --------------------------
   Run script
   -------------------------- */
(async () => {
    const mode = process.argv[2] ?? "all";

    if (mode === "all") {
        await runFullFlow();
    } else if (mode === "individual") {
        console.log("\n🧪 Running Individual Tests...\n");
        await testHealth();
        await testAddPartner();
        await testGetPartners();
        const order = await testCreateOrder();
        const id = order?.orderId ?? order?.id;
        if (id) {
            await testDeliveryFailed(id);
            await testOrderComplete(id);
        } else {
            console.warn("⚠️ No orderId returned by /orders/create — skipping delivery/complete steps.");
        }
        await testUserAnalytics();
        await testASIConsult();
    } else {
        console.log("Usage: npx ts-node test.ts [all|individual]");
    }
})();
