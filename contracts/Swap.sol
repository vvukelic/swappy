// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract SwapManager {
    enum SwapStatus { OPENED, CLOSED, CANCELED }

    struct Swap {
        address payable srcAddress;
        address dstAddress;
        
        address srcTokenAddress;
        uint srcAmount;
        address dstTokenAddress;
        uint dstAmount;
        uint256 expiration;

        SwapStatus status;
    }

    address public owner;
    mapping(bytes32 => Swap) public swaps;
    mapping(address => bytes32[]) public userSwaps;
    address constant private _wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IWETH constant private _weth = IWETH(_wethAddress);

    constructor () {
        owner = msg.sender;
    }

    error SwapFailed();

    function createSwap(address srcTokenAddress, uint srcAmount, address dstTokenAddress, uint dstAmount, uint256 expiration) public payable {
        if (srcTokenAddress == address(0)) {
            require(msg.value >= srcAmount, "Not enough ETH to create a swap!");

            _weth.deposit{value: srcAmount}();
            assert(_weth.transfer(msg.sender, srcAmount));
            srcTokenAddress = _wethAddress;
        }

        console.log(expiration);
        console.log(block.timestamp);
        
        if (expiration > 0) {
            require(expiration > block.timestamp, "Swap expiration should be in the future!");
        }

        Swap memory newSwap;
        newSwap.status = SwapStatus.OPENED;
        newSwap.srcAddress = payable(msg.sender);
        newSwap.srcTokenAddress = srcTokenAddress;
        newSwap.srcAmount = srcAmount;
        newSwap.dstTokenAddress = dstTokenAddress;
        newSwap.dstAmount = dstAmount;
        newSwap.expiration = expiration;

        uint salt = block.number;
        bytes32 newSwapKey;

        do {
            newSwapKey = keccak256(abi.encode(newSwap, salt, msg.sender));
            salt += 1; 
        } while (swaps[newSwapKey].srcAddress != address(0));

        swaps[newSwapKey] = newSwap;
        userSwaps[address(msg.sender)].push(newSwapKey);
    }

    function getUserSwaps(address userAddress) public view returns (bytes32[] memory) {
        return userSwaps[userAddress];
    }

    function takeSwap(bytes32 index) public payable {
        address swapManagerAddress = address(this);
        Swap storage swap = swaps[index];

        require(swap.srcAddress != address(0), "Non existing swap!");
        require(swap.status == SwapStatus.OPENED, "Can't take swap that is not in OPENED status!");
        require(address(msg.sender) != swap.srcAddress, "Cannot take own swap!");

        if (swap.expiration > 0) {
            require(swap.expiration > block.timestamp, "Swap has expired!");
        }

        address payable srcAddress = swap.srcAddress;
        address payable dstAddress = payable(msg.sender);
        address srcTokenAddress = swap.srcTokenAddress;
        ERC20 srcToken = ERC20(srcTokenAddress);
        address dstTokenAddress = swap.dstTokenAddress;
        uint srcAmount = swap.srcAmount;
        uint dstAmount = swap.dstAmount;

        require(srcToken.allowance(srcAddress, swapManagerAddress) >= srcAmount, "Not enough allowence for source token!");

        if (dstTokenAddress == address(0)) {
            require(msg.value >= dstAmount, "Not enough ETH to take a swap!");
            srcAddress.transfer(dstAmount);
        } else {
            ERC20 dstToken = ERC20(dstTokenAddress);
            require(dstToken.allowance(msg.sender, swapManagerAddress) >= dstAmount, "Not enough allowence for destination token!");

            if (!dstToken.transferFrom(msg.sender, srcAddress, dstAmount)) {
                revert SwapFailed();
            }
        }

        if (srcTokenAddress == _wethAddress) {
            if (!srcToken.transferFrom(srcAddress, address(this), srcAmount)) {
                revert SwapFailed();
            }
            
            _weth.withdraw(srcAmount);
            dstAddress.transfer(srcAmount);
        } else {
            if (!srcToken.transferFrom(srcAddress, msg.sender, srcAmount)) {
                revert SwapFailed();
            }
        }

        swap.status = SwapStatus.CLOSED;
    }

    function cancelSwap(bytes32 index) public payable {
        Swap storage swap = swaps[index];

        require(swap.srcAddress != address(0), "Non existing swap!");
        require(swap.status == SwapStatus.OPENED, "Can't cancel swap that is not in OPENED status!");
        require(address(msg.sender) == swap.srcAddress, "Only swap initiator can cancel a swap!");

        swap.status = SwapStatus.CANCELED;
    }

    receive() external payable {}
    fallback() external payable {}
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}
