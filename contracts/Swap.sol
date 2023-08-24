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
    mapping(address => bytes32[]) public dstUserSwaps;
    address constant private _wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IWETH constant private _weth = IWETH(_wethAddress);

    constructor () {
        owner = msg.sender;
    }

    error SwapFailed();

    event SwapCreated(address indexed creator, bytes32 swapHash);

    function createSwap(address srcTokenAddress, uint srcAmount, address dstTokenAddress, uint dstAmount, address dstAddress, uint256 expiresIn) public payable {
        if (srcTokenAddress == address(0)) {
            require(msg.value >= srcAmount, "Not enough ETH to create a swap!");

            _weth.deposit{value: srcAmount}();
            assert(_weth.transfer(msg.sender, srcAmount));
            srcTokenAddress = _wethAddress;
        }

        Swap memory newSwap;
        newSwap.status = SwapStatus.OPENED;
        newSwap.srcAddress = payable(msg.sender);
        newSwap.srcTokenAddress = srcTokenAddress;
        newSwap.srcAmount = srcAmount;
        newSwap.dstTokenAddress = dstTokenAddress;
        newSwap.dstAmount = dstAmount;
        newSwap.dstAddress = dstAddress;

        if (expiresIn > 0) {
            newSwap.expiration = block.timestamp + expiresIn;
        } else {
            newSwap.expiration = 0;
        }

        uint salt = block.number;
        bytes32 newSwapKey;

        do {
            newSwapKey = keccak256(abi.encode(newSwap, salt, msg.sender));
            salt += 1; 
        } while (swaps[newSwapKey].srcAddress != address(0));

        swaps[newSwapKey] = newSwap;
        userSwaps[address(msg.sender)].push(newSwapKey);

        if (dstAddress != address(0)) {
            dstUserSwaps[dstAddress].push(newSwapKey);
        }

        emit SwapCreated(msg.sender, newSwapKey);
    }

    function getSwap(bytes32 swapHash) public view returns (Swap memory) {
        return swaps[swapHash];
    }

    function getUserSwaps(address userAddress) public view returns (bytes32[] memory) {
        return userSwaps[userAddress];
    }

    function getDstUserSwaps(address userAddress) public view returns (bytes32[] memory) {
        return dstUserSwaps[userAddress];
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

        if (swap.dstAddress != address(0)) {
            require(msg.sender == swap.dstAddress, "Only the specified destination address can take this swap!");
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

        if (swap.dstAddress == address(0)) {
            swap.dstAddress = msg.sender;
            dstUserSwaps[swap.dstAddress].push(index);
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
