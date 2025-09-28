const ethers = require("ethers");
const registryAbi = require("../abis/RepRegistry.js");
const orderHistoryAbi = require("../abis/OrderRegistry.js");

function stringToBytes32(str) {
    return ethers.encodeBytes32String(str);
}

function bytes32ToString(bytes32) {
    try {
        return ethers.decodeBytes32String(bytes32);
    } catch {
        return bytes32;
    }
}

class BlockchainDataService {
    constructor(rpcUrl, privateKey, registryAddress, orderRegistryAddress) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);

        // RepRegistry contract
        this.registryContract = new ethers.Contract(
            registryAddress,
            registryAbi,
            this.signer
        );

        // OrderRegistry contract
        this.orderHistoryContract = new ethers.Contract(
            orderRegistryAddress,
            orderHistoryAbi,
            this.signer
        );
    }

    // -------------------------
    // Reputation Methods
    // -------------------------
    async getUserReputation(userId) {
        try {
            const userBytes32 = stringToBytes32(userId.toString());
            const rep = await this.registryContract.getRepByUser(userBytes32);
            return Number(rep);
        } catch (error) {
            console.error("Failed to get user reputation:", error);
            throw new Error(error.message);
        }
    }

    async updateReputation(userId, reputationChange) {
        if (!reputationChange || reputationChange === 0) return null;

        const userBytes32 = stringToBytes32(userId.toString());

        try {
            let tx;

            if (reputationChange > 0) {
                tx = await this.registryContract.increaseRep(userBytes32, reputationChange);
            } else {
                const currentRep = await this.registryContract.getRepByUser(userBytes32);
                const decreaseAmount = Math.min(Math.abs(reputationChange), Number(currentRep));
                if (decreaseAmount > 0) {
                    tx = await this.registryContract.decreaseRep(userBytes32, decreaseAmount);
                }
            }

            if (tx) {
                const receipt = await tx.wait();
                return { transactionHash: receipt.hash, blockNumber: receipt.blockNumber };
            }

            return null;
        } catch (error) {
            console.error("Failed to update reputation:", error);
            throw new Error(error.message);
        }
    }

    // -------------------------
    // Order Methods
    // -------------------------
    async createOrder(orderId, userId, orderValue, productCategory, destination) {
        const orderBytes32 = stringToBytes32(orderId.toString());
        const userBytes32 = stringToBytes32(userId.toString());

        try {
            const tx = await this.orderHistoryContract.createOrder(
                orderBytes32,
                userBytes32,
                ethers.parseEther(orderValue.toString()),
                productCategory,
                destination
            );
            const receipt = await tx.wait();
            return { transactionHash: receipt.hash, orderId };
        } catch (error) {
            console.error("Failed to create order:", error);
            throw new Error(error.message);
        }
    }

    async recordDeliveryFailure(orderId, failureReason) {
        const orderBytes32 = stringToBytes32(orderId.toString());
        try {
            const tx = await this.orderHistoryContract.recordDeliveryFailure(orderBytes32, failureReason);
            const receipt = await tx.wait();
            return { transactionHash: receipt.hash };
        } catch (error) {
            console.error("Failed to record delivery failure:", error);
            throw new Error(error.message);
        }
    }

    async recordProductReturn(orderId) {
        const orderBytes32 = stringToBytes32(orderId.toString());
        try {
            const tx = await this.orderHistoryContract.recordProductReturn(orderBytes32);
            const receipt = await tx.wait();
            return { transactionHash: receipt.hash };
        } catch (error) {
            console.error("Failed to record product return:", error);
            throw new Error(error.message);
        }
    }

    async markOrderCompleted(orderId) {
        const orderBytes32 = stringToBytes32(orderId.toString());
        try {
            const tx = await this.orderHistoryContract.markOrderCompleted(orderBytes32);
            const receipt = await tx.wait();
            return { transactionHash: receipt.hash };
        } catch (error) {
            console.error("Failed to mark order completed:", error);
            throw new Error(error.message);
        }
    }

    async getOrder(orderId) {
        const orderBytes32 = stringToBytes32(orderId.toString());
        try {
            const order = await this.orderHistoryContract.getOrder(orderBytes32);
            return {
                orderId: bytes32ToString(order.orderId),
                userId: bytes32ToString(order.userId),
                orderValue: Number(ethers.formatEther(order.orderValue)),
                status: Number(order.status),
                failureReason: Number(order.failureReason),
                productCategory: order.productCategory,
                createdAt: Number(order.createdAt),
                updatedAt: Number(order.updatedAt),
                deliveryAttempts: Number(order.deliveryAttempts),
                returnedAt: Number(order.returnedAt),
                isActive: order.isActive,
                destination: order.destination
            };
        } catch (error) {
            console.error("Failed to fetch order:", error);
            throw new Error(error.message);
        }
    }

    async getUserData(userId) {
        const userBytes32 = stringToBytes32(userId.toString());
        try {
            const [
                totalOrders,
                completedOrders,
                returnedOrders,
                deliveryFailures,
                totalOrderValue,
                avgOrderValue
            ] = await this.orderHistoryContract.getUserBehaviorStats(userBytes32);

            const fullHistory = await this.orderHistoryContract.getUserOrderHistory(userBytes32);

            const recentOrders = fullHistory
                .map(order => ({
                    orderId: bytes32ToString(order.orderId),
                    orderValue: Number(ethers.formatEther(order.orderValue)),
                    status: Number(order.status),
                    productCategory: order.productCategory,
                    createdAt: Number(order.createdAt)
                }))
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 20);

            let avgDaysBetweenOrders = null;
            if (recentOrders.length > 1) {
                const diffs = [];
                for (let i = 0; i < recentOrders.length - 1; i++) {
                    const daysDiff = (recentOrders[i].createdAt - recentOrders[i + 1].createdAt) / (24 * 60 * 60);
                    diffs.push(daysDiff);
                }
                avgDaysBetweenOrders = diffs.reduce((a, b) => a + b, 0) / diffs.length;
            }

            return {
                totalOrders: Number(totalOrders),
                completedOrders: Number(completedOrders),
                returnedOrders: Number(returnedOrders),
                deliveryFailures: Number(deliveryFailures),
                totalOrderValue: Number(ethers.formatEther(totalOrderValue)),
                avgOrderValue: Number(ethers.formatEther(avgOrderValue)),
                recentOrders,
                avgDaysBetweenOrders
            };
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            throw new Error(error.message);
        }
    }

    // -------------------------
    // Test Connection
    // -------------------------
    async testConnection() {
        try {
            const network = await this.provider.getNetwork();
            return { connected: true, network: network.name };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }
}

module.exports = BlockchainDataService;
