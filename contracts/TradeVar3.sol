// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract TradeManager {
    enum TradeStatus { OPENED, CLOSED, CANCELED }

    struct Trade {
        address payable srcAddress;
        address dstAddress;
        
        address srcTokenAddress;
        uint srcAmount;
        address dstTokenAddress;
        uint dstAmount;
        uint256 expiration;

        TradeStatus status;
    }

    address public owner;
    mapping(bytes32 => Trade) public trades;
    mapping(address => bytes32[]) public userTrades;
    address constant private _wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IWETH constant private _weth = IWETH(_wethAddress);

    constructor () {
        owner = msg.sender;
    }

    error TradeFailed();

    function createTrade(address srcTokenAddress, uint srcAmount, address dstTokenAddress, uint dstAmount, uint256 expiration) public payable {
        if (srcTokenAddress == address(0)) {
            require(msg.value >= srcAmount, "Not enough ETH to create a trade!");

            _weth.deposit{value: srcAmount}();
            assert(_weth.transfer(msg.sender, srcAmount));
            srcTokenAddress = _wethAddress;
        }

        console.log(expiration);
        console.log(block.timestamp);
        if (expiration > 0) {
            require(expiration > block.timestamp, "Trade expiration should be in the future!");
        }

        Trade memory newTrade;
        newTrade.status = TradeStatus.OPENED;
        newTrade.srcAddress = payable(msg.sender);
        newTrade.srcTokenAddress = srcTokenAddress;
        newTrade.srcAmount = srcAmount;
        newTrade.dstTokenAddress = dstTokenAddress;
        newTrade.dstAmount = dstAmount;
        newTrade.expiration = expiration;

        uint salt = block.number;
        bytes32 newTradeKey;

        do {
            newTradeKey = keccak256(abi.encode(newTrade, salt, msg.sender));
            salt += 1; 
        } while (trades[newTradeKey].srcAddress != address(0));

        trades[newTradeKey] = newTrade;
        userTrades[address(msg.sender)].push(newTradeKey);
    }

    function getUserTrades(address userAddress) public view returns (bytes32[] memory) {
        return userTrades[userAddress];
    }

    function takeTrade(bytes32 index) public payable {
        address tradeManagerAddress = address(this);
        Trade storage trade = trades[index];

        require(trade.srcAddress != address(0), "Non existing trade!");
        require(trade.status == TradeStatus.OPENED, "Can't take trade that is not in OPENED status!");
        require(address(msg.sender) != trade.srcAddress, "Cannot take own trade!");
        if (trade.expiration > 0) {
            require(trade.expiration > block.timestamp, "Trade has expired!");
        }

        address payable srcAddress = trade.srcAddress;
        address payable dstAddress = payable(msg.sender);
        address srcTokenAddress = trade.srcTokenAddress;
        ERC20 srcToken = ERC20(srcTokenAddress);
        address dstTokenAddress = trade.dstTokenAddress;
        uint srcAmount = trade.srcAmount;
        uint dstAmount = trade.dstAmount;

        require(srcToken.allowance(srcAddress, tradeManagerAddress) >= srcAmount, "Not enough allowence for source token!");

        if (dstTokenAddress == address(0)) {
            require(msg.value >= dstAmount, "Not enough ETH to take a trade!");
            srcAddress.transfer(dstAmount);
        } else {
            ERC20 dstToken = ERC20(dstTokenAddress);
            require(dstToken.allowance(msg.sender, tradeManagerAddress) >= dstAmount, "Not enough allowence for destination token!");

            if (!dstToken.transferFrom(msg.sender, srcAddress, dstAmount)) {
                revert TradeFailed();
            }
        }

        if (srcTokenAddress == _wethAddress) {
            if (!srcToken.transferFrom(srcAddress, address(this), srcAmount)) {
                revert TradeFailed();
            }
            
            _weth.withdraw(srcAmount);
            dstAddress.transfer(srcAmount);
        } else {
            if (!srcToken.transferFrom(srcAddress, msg.sender, srcAmount)) {
                revert TradeFailed();
            }
        }

        trade.status = TradeStatus.CLOSED;
    }

    function cancelTrade(bytes32 index) public payable {
        Trade storage trade = trades[index];

        require(trade.srcAddress != address(0), "Non existing trade!");
        require(trade.status == TradeStatus.OPENED, "Can't cancel trade that is not in OPENED status!");
        require(address(msg.sender) == trade.srcAddress, "Only trade initiator can cancel a trade!");

        trade.status = TradeStatus.CANCELED;
    }

    receive() external payable {}
    fallback() external payable {}
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}
