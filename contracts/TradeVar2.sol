// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract TradeManager {
    address public owner;
    address[] public deployedTrades;
    address constant private _wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IWETH constant private _weth = IWETH(_wethAddress);

    constructor () {
        owner = msg.sender;
    }

    error TradeFailed();

    function createTrade(address srcTokenAddress, uint srcAmount, address dstTokenAddress, uint dstAmount) public payable {
        if (srcTokenAddress == address(0)) {
            require(msg.value >= srcAmount, "Not enough ETH to create a trade!");

            _weth.deposit{value: srcAmount}();
            assert(_weth.transfer(msg.sender, srcAmount));
            srcTokenAddress = _wethAddress;
        }

        address newTrade = address(new Trade(payable(msg.sender), srcTokenAddress, srcAmount, dstTokenAddress, dstAmount));
        deployedTrades.push(newTrade);
    }

    function getDeployedTrades() public view returns (address[] memory) {
        return deployedTrades;
    }

    receive() external payable {}
    fallback() external payable {}
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}

contract Trade {
    enum Status { OPENED, CLOSED, CANCELED }

    address payable public srcAddress;
    address public dstAddress;
    
    address public srcTokenAddress;
    uint public srcAmount;
    address public dstTokenAddress;
    uint public dstAmount;

    Status public status = Status.OPENED;
    address constant private _wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IWETH constant private _weth = IWETH(_wethAddress);

    error TradeFailed();

    constructor (address payable _srcAddress, address _srcTokenAddress, uint _srcAmount, address _dstTokenAddress, uint _dstAmount) {
        srcAddress = _srcAddress;

        srcTokenAddress = _srcTokenAddress;
        srcAmount = _srcAmount;
        dstTokenAddress = _dstTokenAddress;
        dstAmount = _dstAmount;

        require(ERC20(srcTokenAddress).balanceOf(srcAddress) >= srcAmount, "Not enough balance for this trade!");
    }

    function take() public payable {
        require(status == Trade.Status.OPENED);

        ERC20 srcToken = ERC20(srcTokenAddress);
        address tradeAddress = address(this);

        require(srcToken.allowance(srcAddress, tradeAddress) >= srcAmount, "Not enough allowence for source token!");

        if (dstTokenAddress == address(0)) {
            require(msg.value >= dstAmount, "Not enough ETH to take a trade!");
            srcAddress.transfer(dstAmount);
        } else {
            ERC20 dstToken = ERC20(dstTokenAddress);
            require(dstToken.allowance(msg.sender, tradeAddress) >= dstAmount, "Not enough allowence for destination token!");

            if (!dstToken.transferFrom(msg.sender, srcAddress, dstAmount)) {
                revert TradeFailed();
            }
        }

        if (srcTokenAddress == _wethAddress) {
            if (!srcToken.transferFrom(srcAddress, address(this), srcAmount)) {
                revert TradeFailed();
            }
            
            _weth.withdraw(srcAmount);
            payable(msg.sender).transfer(srcAmount);
        } else {
            if (!srcToken.transferFrom(srcAddress, msg.sender, srcAmount)) {
                revert TradeFailed();
            }
        }

        this._close(address(msg.sender));
    }

    function _close(address _dstAddress) public payable {
        dstAddress = _dstAddress;
        status = Status.CLOSED;
    }

    function cancel() public payable {
        status = Status.CANCELED;
    }

    receive() external payable {}
    fallback() external payable {}
}
