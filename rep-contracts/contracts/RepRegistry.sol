// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RepRegistry {
    
    mapping (bytes32 => uint256) public reputation;

    bytes32 public constant MANAGER = keccak256("MANAGER");

    address repManager;

    modifier hasRole(address sender) {
        require(sender == repManager);
        _;
    }

    constructor(address manager) {
        require(manager != address(0));
        repManager = manager;
    }

    function increaseRep(bytes32 userIdentifier, uint256 points) hasRole(msg.sender) external{

        reputation[userIdentifier] += points;
        
    }

    function decreaseRep(bytes32 userIdentifier, uint256 points) hasRole(msg.sender) external{

        reputation[userIdentifier] -= points;
        
    }

    function getRepByUser(bytes32 userIdentifier) public view returns(uint256){
        return reputation[userIdentifier];
    }

}