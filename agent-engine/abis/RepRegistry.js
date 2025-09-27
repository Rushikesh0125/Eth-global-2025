const registryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "manager",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "MANAGER",
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
        "name": "userIdentifier",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "points",
        "type": "uint256"
      }
    ],
    "name": "decreaseRep",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "userIdentifier",
        "type": "bytes32"
      }
    ],
    "name": "getRepByUser",
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
        "name": "userIdentifier",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "points",
        "type": "uint256"
      }
    ],
    "name": "increaseRep",
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
    "name": "reputation",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

module.exports = registryAbi;
