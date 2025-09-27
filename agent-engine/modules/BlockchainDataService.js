class BlockchainDataService {
    static async getUserData(userId) {
        try {
            const userBytes32 = stringToBytes32(userId);

            // Get user behavior stats
            const [totalOrders, completedOrders, returnedOrders, deliveryFailures, totalOrderValue, avgOrderValue] =
                await orderHistoryContract.getUserBehaviorStats(userBytes32);

            // Get recent order history
            const fullHistory = await orderHistoryContract.getUserOrderHistory(userBytes32);

            const stats = {
                totalOrders: Number(totalOrders),
                completedOrders: Number(completedOrders),
                returnedOrders: Number(returnedOrders),
                deliveryFailures: Number(deliveryFailures),
                totalOrderValue: Number(ethers.formatEther(totalOrderValue)),
                avgOrderValue: Number(ethers.formatEther(avgOrderValue))
            };

            const recentOrders = fullHistory
                .map(order => ({
                    orderId: order.orderId,
                    orderValue: Number(ethers.formatEther(order.orderValue)),
                    status: Number(order.status),
                    productCategory: order.productCategory,
                    createdAt: Number(order.createdAt)
                }))
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 20); // Last 20 orders

            // Calculate additional metrics
            let avgDaysBetweenOrders = null;
            if (recentOrders.length > 1) {
                const daysDiffs = [];
                for (let i = 0; i < recentOrders.length - 1; i++) {
                    const daysDiff = (recentOrders[i].createdAt - recentOrders[i + 1].createdAt) / (24 * 60 * 60);
                    daysDiffs.push(daysDiff);
                }
                avgDaysBetweenOrders = daysDiffs.reduce((a, b) => a + b, 0) / daysDiffs.length;
            }

            return { ...stats, recentOrders, avgDaysBetweenOrders };
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            throw new Error(`Blockchain data fetch failed: ${error.message}`);
        }
    }

    static async updateReputation(userId, reputationChange) {
        if (reputationChange === 0) return null;

        try {
            const userBytes32 = stringToBytes32(userId);
            let tx;

            if (reputationChange > 0) {
                tx = await registryContract.increaseRep(userBytes32, Math.abs(reputationChange));
            } else {
                // Check current reputation to prevent underflow
                const currentRep = await registryContract.getRepByUser(userBytes32);
                const decreaseAmount = Math.min(Math.abs(reputationChange), Number(currentRep));

                if (decreaseAmount > 0) {
                    tx = await registryContract.decreaseRep(userBytes32, decreaseAmount);
                }
            }

            if (tx) {
                const receipt = await tx.wait();
                return {
                    transactionHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString()
                };
            }

            return null;
        } catch (error) {
            console.error('Reputation update failed:', error);
            throw new Error(`Blockchain update failed: ${error.message}`);
        }
    }
}