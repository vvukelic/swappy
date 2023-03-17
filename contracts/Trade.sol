// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract TradeManager {
    address public owner;
    address[] public deployedTrades;

    constructor () {
        owner = msg.sender;
    }

    error TradeFailed();

    function createTrade(address srcTokenAddress, uint srcAmount, address dstTokenAddress, uint dstAmount) public {
        address newTrade = address(new Trade(msg.sender, srcTokenAddress, srcAmount, dstTokenAddress, dstAmount));
        deployedTrades.push(newTrade);
        console.log(newTrade);
    }

    function getDeployedTrades() public view returns (address[] memory) {
        return deployedTrades;
    }

    function takeTrade(address tradeAddress) public payable {
        address tradeManagerAddress = address(this);
        ITrade trade = ITrade(tradeAddress);

        require(trade.srcToken().allowance(trade.srcAddress(), tradeManagerAddress) >= trade.srcAmount(), "Not enough allowence for source token!");
        require(trade.dstToken().allowance(msg.sender, tradeManagerAddress) >= trade.dstAmount(), "Not enough allowence for destination token!");

        if (!trade.dstToken().transferFrom(msg.sender, trade.srcAddress(), trade.dstAmount())) {
            revert TradeFailed();
        }

        if (!trade.srcToken().transferFrom(trade.srcAddress(), msg.sender, trade.srcAmount())) {
            revert TradeFailed();
        }
    }
}

interface ITrade {
    function srcAddress() external view returns (address);
    function srcToken() external view returns (ERC20);
    function srcAmount() external view returns (uint);
    function dstToken() external view returns (ERC20);
    function dstAmount() external view returns (uint);
}

contract Trade {
    address public srcAddress;
    address public dstAddress;
    
    ERC20 public srcToken;
    uint public srcAmount;
    ERC20 public dstToken;
    uint public dstAmount;

    constructor (address _srcAddress, address srcTokenAddress, uint _srcAmount, address dstTokenAddress, uint _dstAmount) {
        srcAddress = _srcAddress;

        srcToken = ERC20(srcTokenAddress);
        srcAmount = _srcAmount;
        dstToken = ERC20(dstTokenAddress);
        dstAmount = _dstAmount;
        console.log(srcToken.balanceOf(srcAddress));

        require(srcToken.balanceOf(srcAddress) >= srcAmount, "Not enough balance for this trade!");
     }
}
