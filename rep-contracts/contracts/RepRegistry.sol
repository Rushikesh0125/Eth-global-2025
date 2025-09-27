// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract RepRegistry is AccessControl{
    
    mapping (bytes32 => uint256) public reputation;

    bytes32 public constant MANAGER = keccak256("MANAGER");

    constructor(address manager) {
        grantRole(MANAGER, manager);
    }

    function increaseRep(bytes32 userIdentifier, uint256 points) external{
        require(hasRole(MANAGER, msg.sender), "Only manager can update rep points");

        reputation[userIdentifier] += points;
        
    }

    function decreaseRep(bytes32 userIdentifier, uint256 points) external{
        require(hasRole(MANAGER, msg.sender), "Only manager can update rep points");

        reputation[userIdentifier] -= points;
        
    }

    function getRepByUser(bytes32 userIdentifier) public view returns(uint256){
        return reputation[userIdentifier];
    }

}