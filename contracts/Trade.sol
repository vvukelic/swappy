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
        address newTrade = address(new Trade(msg.sender, srcTokenAddress, srcAmount, dstTokenAddress, dstAmount));
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

    constructor (address owner, address srcTokenAddress, uint _srcAmount, address dstTokenAddress, uint _dstAmount) {
        srcAddress = owner;

        srcToken = ERC20(srcTokenAddress);
        srcAmount = _srcAmount;
        dstToken = ERC20(dstTokenAddress);
        dstAmount = _dstAmount;
        console.log(srcToken.balanceOf(srcAddress));

        require(srcToken.balanceOf(srcAddress) >= srcAmount);
     }

    function take() public payable {
        dstAddress = msg.sender;

        require(srcToken.balanceOf(srcAddress) >= srcAmount);
        require(dstToken.balanceOf(dstAddress) >= dstAmount);

        if (!dstToken.transferFrom(dstAddress, srcAddress, dstAmount)) {
            revert TransferFailed();
        }

        if (!srcToken.transferFrom(srcAddress, dstAddress, srcAmount)) {
            revert TransferFailed();
        }
    }
}
