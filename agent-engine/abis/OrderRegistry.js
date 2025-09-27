const orderHistoryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recorder",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "neededRole",
        "type": "bytes32"
      }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum OrderRegistry.DeliveryFailureReason",
        "name": "reason",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "attemptNumber",
        "type": "uint8"
      }
    ],
    "name": "DeliveryFailed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "orderValue",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "productCategory",
        "type": "string"
      }
    ],
    "name": "OrderCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum OrderRegistry.OrderStatus",
        "name": "oldStatus",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum OrderRegistry.OrderStatus",
        "name": "newStatus",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "OrderStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "returnedAt",
        "type": "uint256"
      }
    ],
    "name": "ProductReturned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
      }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "RECORDER_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "orderValue",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "productCategory",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "destination",
        "type": "string"
      }
    ],
    "name": "createOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      }
    ],
    "name": "deactivateOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      }
    ],
    "name": "getOrder",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "orderId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "userId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "orderValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          },
          {
            "internalType": "enum OrderRegistry.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum OrderRegistry.DeliveryFailureReason",
            "name": "failureReason",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "productCategory",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "deliveryAttempts",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "returnedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "destination",
            "type": "string"
          }
        ],
        "internalType": "struct OrderRegistry.Order",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "internalType": "enum OrderRegistry.OrderStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "getOrdersByStatus",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "orderId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "userId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "orderValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          },
          {
            "internalType": "enum OrderRegistry.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum OrderRegistry.DeliveryFailureReason",
            "name": "failureReason",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "productCategory",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "deliveryAttempts",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "returnedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "destination",
            "type": "string"
          }
        ],
        "internalType": "struct OrderRegistry.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "daysSince",
        "type": "uint256"
      }
    ],
    "name": "getRecentOrders",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "orderId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "userId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "orderValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          },
          {
            "internalType": "enum OrderRegistry.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum OrderRegistry.DeliveryFailureReason",
            "name": "failureReason",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "productCategory",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "deliveryAttempts",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "returnedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "destination",
            "type": "string"
          }
        ],
        "internalType": "struct OrderRegistry.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      }
    ],
    "name": "getUserBehaviorStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalOrders",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "completedOrders",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "returnedOrders",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deliveryFailures",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalOrderValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "avgOrderValue",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      }
    ],
    "name": "getUserOrderHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "orderId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "userId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "orderValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          },
          {
            "internalType": "enum OrderRegistry.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum OrderRegistry.DeliveryFailureReason",
            "name": "failureReason",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "productCategory",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "deliveryAttempts",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "returnedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "destination",
            "type": "string"
          }
        ],
        "internalType": "struct OrderRegistry.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getUserOrdersPaginated",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "orderId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "userId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "orderValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          },
          {
            "internalType": "enum OrderRegistry.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum OrderRegistry.DeliveryFailureReason",
            "name": "failureReason",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "productCategory",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "deliveryAttempts",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "returnedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "destination",
            "type": "string"
          }
        ],
        "internalType": "struct OrderRegistry.Order[]",
        "name": "",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recorder",
        "type": "address"
      }
    ],
    "name": "grantRecorderRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      }
    ],
    "name": "markOrderCompleted",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "orders",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "userId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "orderValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "updatedAt",
        "type": "uint256"
      },
      {
        "internalType": "enum OrderRegistry.OrderStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "enum OrderRegistry.DeliveryFailureReason",
        "name": "failureReason",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "productCategory",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "deliveryAttempts",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "returnedAt",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "destination",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      },
      {
        "internalType": "enum OrderRegistry.DeliveryFailureReason",
        "name": "reason",
        "type": "uint8"
      }
    ],
    "name": "recordDeliveryFailure",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      }
    ],
    "name": "recordProductReturn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "callerConfirmation",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recorder",
        "type": "address"
      }
    ],
    "name": "revokeRecorderRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "orderId",
        "type": "bytes32"
      },
      {
        "internalType": "enum OrderRegistry.OrderStatus",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "updateOrderStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "userOrderCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userOrders",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

module.exports = orderHistoryAbi;

