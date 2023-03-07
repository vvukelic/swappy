// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TradeFactory {
    address public owner;
    address[] public deployedTrades;

    constructor () {
        owner = msg.sender;
    }

    function createTrade(address srcTokenAddress, uint srcAmount, address dstTokenAddress, uint dstAmount) public {
        address newTrade = address(new Trade(srcTokenAddress, srcAmount, dstTokenAddress, dstAmount));
        deployedTrades.push(newTrade);
    }

    function getDeployedTrades() public view returns (address[] memory) {
        return deployedTrades;
    }
}

contract Trade {
    address public srcAddress;
    address public dstAddress;
    
    ERC20 public srcToken;
    uint public srcAmount;
    ERC20 public dstToken;
    uint public dstAmount;

    error TransferFailed();

    constructor (address srcTokenAddress, uint _srcAmount, address dstTokenAddress, uint _dstAmount) {
        srcAddress = msg.sender;

        srcToken = ERC20(srcTokenAddress);
        srcAmount = _srcAmount;
        dstToken = ERC20(dstTokenAddress);
        dstAmount = _dstAmount;

        require(srcToken.balanceOf(msg.sender) >= srcAmount);

        if (!srcToken.transferFrom(msg.sender, address(this), srcAmount)) {
            revert TransferFailed();
        }
    }

    function take() public payable {
        require(dstToken.balanceOf(msg.sender) >= dstAmount);

        dstAddress = msg.sender;

        if (!dstToken.transferFrom(msg.sender, srcAddress, dstAmount)) {
            revert TransferFailed();
        }

        if (!srcToken.transferFrom(address(this), dstAddress, srcAmount)) {
            revert TransferFailed();
        }
    }
}
