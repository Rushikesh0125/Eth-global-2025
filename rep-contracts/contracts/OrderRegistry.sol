// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract OrderRegistry is AccessControl {
    
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");
    
    enum OrderStatus {
        CREATED,           // 0: Order created
        PAID,              // 1: Payment completed
        SHIPPED,           // 2: Order shipped
        DELIVERED,         // 3: Successfully delivered
        RETURNED,          // 4: Product returned
        DELIVERY_FAILED,   // 5: Delivery failed (absent/refused)
        COMPLETED,         // 6: Order completed (no return)
        CANCELLED          // 7: Order cancelled
    }
    
    enum DeliveryFailureReason {
        NONE,              // 0: No failure
        USER_ABSENT,       // 1: User was absent
        USER_REFUSED,      // 2: User refused delivery
        ADDRESS_INVALID,   // 3: Invalid address
        OTHER              // 4: Other reasons
    }
    
    struct Order {
        bytes32 orderId;
        bytes32 userId;
        uint256 orderValue;
        uint256 createdAt;
        uint256 updatedAt;
        OrderStatus status;
        DeliveryFailureReason failureReason;
        string productCategory;
        uint8 deliveryAttempts;
        uint256 returnedAt;
        bool isActive;
        string destination;
    }
    
    // Mappings
    mapping(bytes32 => Order) public orders;
    mapping(bytes32 => bytes32[]) public userOrders; // userId => orderIds[]
    mapping(bytes32 => uint256) public userOrderCount;
    
    // Events
    event OrderCreated(
        bytes32 indexed orderId,
        bytes32 indexed userId,
        uint256 orderValue,
        string productCategory
    );
    
    event OrderStatusUpdated(
        bytes32 indexed orderId,
        bytes32 indexed userId,
        OrderStatus oldStatus,
        OrderStatus newStatus,
        uint256 timestamp
    );
    
    event DeliveryFailed(
        bytes32 indexed orderId,
        bytes32 indexed userId,
        DeliveryFailureReason reason,
        uint8 attemptNumber
    );
    
    event ProductReturned(
        bytes32 indexed orderId,
        bytes32 indexed userId,
        uint256 returnedAt
    );
    
    constructor(address recorder) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RECORDER_ROLE, recorder);
    }
    
    modifier onlyRecorder() {
        require(hasRole(RECORDER_ROLE, msg.sender), "Only recorder can perform this action");
        _;
    }
    
    modifier orderExists(bytes32 orderId) {
        require(orders[orderId].isActive, "Order does not exist");
        _;
    }
    
    function createOrder(
        bytes32 orderId,
        bytes32 userId,
        uint256 orderValue,
        string memory productCategory,
        string memory destination
    ) external onlyRecorder {
        require(!orders[orderId].isActive, "Order already exists");
        require(orderValue > 0, "Order value must be greater than 0");
        
        Order memory newOrder = Order({
            orderId: orderId,
            userId: userId,
            orderValue: orderValue,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            status: OrderStatus.CREATED,
            failureReason: DeliveryFailureReason.NONE,
            productCategory: productCategory,
            deliveryAttempts: 0,
            returnedAt: 0,
            isActive: true,
            destination: destination
        });
        
        orders[orderId] = newOrder;
        userOrders[userId].push(orderId);
        userOrderCount[userId]++;
        
        emit OrderCreated(orderId, userId, orderValue, productCategory);
    }
    
    function updateOrderStatus(
        bytes32 orderId,
        OrderStatus newStatus
    ) external onlyRecorder orderExists(orderId) {
        Order storage order = orders[orderId];
        OrderStatus oldStatus = order.status;
        
        require(oldStatus != newStatus, "Status is already set");
        require(_isValidStatusTransition(oldStatus, newStatus), "Invalid status transition");
        
        order.status = newStatus;
        order.updatedAt = block.timestamp;
        
        emit OrderStatusUpdated(orderId, order.userId, oldStatus, newStatus, block.timestamp);
    }
    
    function recordDeliveryFailure(
        bytes32 orderId,
        DeliveryFailureReason reason
    ) external onlyRecorder orderExists(orderId) {
        Order storage order = orders[orderId];
        
        require(order.status == OrderStatus.SHIPPED, "Order must be in shipped status");
        
        order.status = OrderStatus.DELIVERY_FAILED;
        order.failureReason = reason;
        order.deliveryAttempts++;
        order.updatedAt = block.timestamp;
        
        emit DeliveryFailed(orderId, order.userId, reason, order.deliveryAttempts);
    }
    
    function recordProductReturn(
        bytes32 orderId
    ) external onlyRecorder orderExists(orderId) {
        Order storage order = orders[orderId];
        
        require(order.status == OrderStatus.DELIVERED, "Order must be delivered to return");
        
        order.status = OrderStatus.RETURNED;
        order.returnedAt = block.timestamp;
        order.updatedAt = block.timestamp;
        
        emit ProductReturned(orderId, order.userId, block.timestamp);
    }
    
    function markOrderCompleted(bytes32 orderId) external onlyRecorder orderExists(orderId) {
        Order storage order = orders[orderId];
        
        require(
            order.status == OrderStatus.DELIVERED || order.status == OrderStatus.PAID,
            "Order must be delivered or paid to complete"
        );
        
        order.status = OrderStatus.COMPLETED;
        order.updatedAt = block.timestamp;
        
        emit OrderStatusUpdated(orderId, order.userId, OrderStatus.DELIVERED, OrderStatus.COMPLETED, block.timestamp);
    }
    
    // View functions for AI analysis
    function getUserOrderHistory(bytes32 userId) external view returns (Order[] memory) {
        bytes32[] memory orderIds = userOrders[userId];
        Order[] memory userOrderHistory = new Order[](orderIds.length);
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            userOrderHistory[i] = orders[orderIds[i]];
        }
        
        return userOrderHistory;
    }
    
    function getUserOrdersPaginated(
        bytes32 userId,
        uint256 offset,
        uint256 limit
    ) external view returns (Order[] memory, uint256 total) {
        bytes32[] memory orderIds = userOrders[userId];
        uint256 totalOrders = orderIds.length;
        
        if (offset >= totalOrders) {
            return (new Order[](0), totalOrders);
        }
        
        uint256 end = offset + limit;
        if (end > totalOrders) {
            end = totalOrders;
        }
        
        uint256 resultLength = end - offset;
        Order[] memory result = new Order[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = orders[orderIds[offset + i]];
        }
        
        return (result, totalOrders);
    }
    
    function getUserBehaviorStats(bytes32 userId) external view returns (
        uint256 totalOrders,
        uint256 completedOrders,
        uint256 returnedOrders,
        uint256 deliveryFailures,
        uint256 totalOrderValue,
        uint256 avgOrderValue
    ) {
        bytes32[] memory orderIds = userOrders[userId];
        totalOrders = orderIds.length;
        
        if (totalOrders == 0) {
            return (0, 0, 0, 0, 0, 0);
        }
        
        for (uint256 i = 0; i < totalOrders; i++) {
            Order memory order = orders[orderIds[i]];
            totalOrderValue += order.orderValue;
            
            if (order.status == OrderStatus.COMPLETED || order.status == OrderStatus.DELIVERED) {
                completedOrders++;
            }
            
            if (order.status == OrderStatus.RETURNED) {
                returnedOrders++;
            }
            
            if (order.status == OrderStatus.DELIVERY_FAILED) {
                deliveryFailures++;
            }
        }
        
        avgOrderValue = totalOrderValue / totalOrders;
    }
    
    function getOrdersByStatus(
        bytes32 userId,
        OrderStatus status
    ) external view returns (Order[] memory) {
        bytes32[] memory orderIds = userOrders[userId];
        
        // First pass: count matching orders
        uint256 matchCount = 0;
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].status == status) {
                matchCount++;
            }
        }
        
        // Second pass: collect matching orders
        Order[] memory matchingOrders = new Order[](matchCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].status == status) {
                matchingOrders[currentIndex] = orders[orderIds[i]];
                currentIndex++;
            }
        }
        
        return matchingOrders;
    }
    
    function getRecentOrders(
        bytes32 userId,
        uint256 daysSince
    ) external view returns (Order[] memory) {
        bytes32[] memory orderIds = userOrders[userId];
        uint256 cutoffTime = block.timestamp - (daysSince * 1 days);
        
        // First pass: count recent orders
        uint256 recentCount = 0;
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].createdAt >= cutoffTime) {
                recentCount++;
            }
        }
        
        // Second pass: collect recent orders
        Order[] memory recentOrders = new Order[](recentCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].createdAt >= cutoffTime) {
                recentOrders[currentIndex] = orders[orderIds[i]];
                currentIndex++;
            }
        }
        
        return recentOrders;
    }
    
    function getOrder(bytes32 orderId) external view returns (Order memory) {
        require(orders[orderId].isActive, "Order does not exist");
        return orders[orderId];
    }
    
    // Internal function to validate status transitions
    function _isValidStatusTransition(
        OrderStatus from,
        OrderStatus to
    ) internal pure returns (bool) {
        if (from == OrderStatus.CREATED) {
            return to == OrderStatus.PAID || to == OrderStatus.CANCELLED;
        }
        if (from == OrderStatus.PAID) {
            return to == OrderStatus.SHIPPED || to == OrderStatus.CANCELLED;
        }
        if (from == OrderStatus.SHIPPED) {
            return to == OrderStatus.DELIVERED || to == OrderStatus.DELIVERY_FAILED || to == OrderStatus.CANCELLED;
        }
        if (from == OrderStatus.DELIVERED) {
            return to == OrderStatus.RETURNED || to == OrderStatus.COMPLETED;
        }
        if (from == OrderStatus.DELIVERY_FAILED) {
            return to == OrderStatus.SHIPPED || to == OrderStatus.CANCELLED;
        }
        
        return false;
    }
    
    // Admin functions
    function grantRecorderRole(address recorder) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RECORDER_ROLE, recorder);
    }
    
    function revokeRecorderRole(address recorder) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(RECORDER_ROLE, recorder);
    }
    
    // Emergency functions
    function deactivateOrder(bytes32 orderId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(orders[orderId].isActive, "Order does not exist");
        orders[orderId].isActive = false;
    }
}