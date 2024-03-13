// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

contract SwapManager is ReentrancyGuard {
    enum SwapStatus { OPENED, CANCELED }

    struct Swap {
        address payable dstAddress;

        uint srcAmount;
        uint dstAmount;

        uint256 closedTime;
    }

    struct SwapOffer {
        address payable srcAddress;
        address dstAddress;
        
        address srcTokenAddress;
        uint srcAmount;
        address dstTokenAddress;
        uint dstAmount;

        uint256 feeAmount;

        uint256 createdTime;
        uint256 expirationTime;

        bool partialFillEnabled;

        SwapStatus status;
    }

    address public owner;
    address payable public feeAddress;
    mapping(bytes32 => SwapOffer) public swapOffers;
    mapping(bytes32 => Swap[]) public swaps;
    mapping(address => bytes32[]) public userSwapOffers;
    mapping(address => bytes32[]) public swapOffersForUser;
    mapping(address => bytes32[]) public swapOffersTakenByUser;
    address constant private _wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IWETH constant private _weth = IWETH(_wethAddress);
    AggregatorV3Interface internal priceFeed;

    constructor (address payable _feeAddress) {
        require(_feeAddress != address(0), "Fee address cannot be the zero address");

        owner = msg.sender;
        feeAddress = _feeAddress;
        priceFeed = AggregatorV3Interface(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419);
    }

    error SwapFailed();

    event SwapOfferCreated(address indexed creator, bytes32 swapHash);

    function createSwapOffer(address srcTokenAddress, uint srcAmount, address dstTokenAddress, uint dstAmount, address dstAddress, uint256 expiresIn, bool partialFillEnabled) public payable {
        if (srcTokenAddress == address(0)) {
            require(msg.value >= srcAmount, "Not enough ETH to create a swap!");

            _weth.deposit{value: srcAmount}();
            assert(_weth.transfer(msg.sender, srcAmount));
            srcTokenAddress = _wethAddress;
        }

        SwapOffer memory newSwapOffer;
        newSwapOffer.status = SwapStatus.OPENED;
        newSwapOffer.srcAddress = payable(msg.sender);
        newSwapOffer.srcTokenAddress = srcTokenAddress;
        newSwapOffer.srcAmount = srcAmount;
        newSwapOffer.dstTokenAddress = dstTokenAddress;
        newSwapOffer.dstAmount = dstAmount;
        newSwapOffer.dstAddress = dstAddress;
        newSwapOffer.createdTime = block.timestamp;
        newSwapOffer.feeAmount = calculateEthFee();
        newSwapOffer.partialFillEnabled = partialFillEnabled;

        if (expiresIn > 0) {
            newSwapOffer.expirationTime = block.timestamp + expiresIn;
        } else {
            newSwapOffer.expirationTime = 0;
        }

        uint salt = block.number;
        bytes32 newSwapKey;

        do {
            newSwapKey = keccak256(abi.encode(newSwapOffer, salt, msg.sender));
            salt += 1; 
        } while (swapOffers[newSwapKey].srcAddress != address(0));

        swapOffers[newSwapKey] = newSwapOffer;
        userSwapOffers[address(msg.sender)].push(newSwapKey);

        if (dstAddress != address(0)) {
            swapOffersForUser[dstAddress].push(newSwapKey);
        }

        emit SwapOfferCreated(msg.sender, newSwapKey);
    }

    function getSwapOffer(bytes32 swapOfferHash) public view returns (SwapOffer memory) {
        return swapOffers[swapOfferHash];
    }

    function getSwapsForOffer(bytes32 swapOfferHash) public view returns (Swap[] memory) {
        return swaps[swapOfferHash];
    }

    function getUserSwapOffers(address userAddress) public view returns (bytes32[] memory) {
        return userSwapOffers[userAddress];
    }

    function getSwapOffersForUser(address userAddress) public view returns (bytes32[] memory) {
        return swapOffersForUser[userAddress];
    }

    function getSwapOffersTakenByUser(address userAddress) public view returns (bytes32[] memory) {
        return swapOffersTakenByUser[userAddress];
    }

    function createSwapForOffer(bytes32 swapOfferHash, uint partialDstAmount) public payable nonReentrant {
        address swapManagerAddress = address(this);
        SwapOffer storage swapOffer = swapOffers[swapOfferHash];
        Swap[] storage swapsForOffer = swaps[swapOfferHash];

        require(swapOffer.srcAddress != address(0), "Non existing swap offer!");
        require(swapOffer.status == SwapStatus.OPENED, "Can't create swap for offer that is not in OPENED status!");
        require(address(msg.sender) != swapOffer.srcAddress, "Cannot create swap for own swap offer!");

        if (swapOffer.partialFillEnabled) {
            require(partialDstAmount <= swapOffer.dstAmount, "Sent amount higher than swap offer amount!");
        } else {
            require(partialDstAmount == swapOffer.dstAmount, "Can't create partial swap for offer that is not a partial fill offer!");
        }

        if (swapOffer.expirationTime > 0) {
            require(swapOffer.expirationTime > block.timestamp, "Swap offer has expired!");
        }

        if (swapOffer.dstAddress != address(0)) {
            require(msg.sender == swapOffer.dstAddress, "Only the specified destination address can take this swap offer!");
        }

        uint swapsSrcAmountSum = 0;
        uint swapsDstAmountSum = 0;
        for (uint i = 0; i < swapsForOffer.length; i++) {
            swapsSrcAmountSum += swapsForOffer[i].srcAmount;
            swapsDstAmountSum += swapsForOffer[i].dstAmount;
        }

        uint remainingDstAmount = swapOffer.dstAmount - swapsDstAmountSum;
        require(partialDstAmount <= remainingDstAmount, "There's not enough resources left in offer for this swap!");

        Swap memory swap;
        swap.dstAddress = payable(msg.sender);
        swap.dstAmount = partialDstAmount;
        swap.closedTime = block.timestamp;

        if (partialDstAmount == remainingDstAmount) {
            swap.srcAmount = swapOffer.srcAmount - swapsSrcAmountSum;
        } else {
            swap.srcAmount = (partialDstAmount * swapOffer.srcAmount) / swapOffer.dstAmount;
        }

        address payable dstAddress = payable(msg.sender);
        address srcTokenAddress = swapOffer.srcTokenAddress;
        ERC20 srcToken = ERC20(srcTokenAddress);
        address dstTokenAddress = swapOffer.dstTokenAddress;

        require(srcToken.allowance(swapOffer.srcAddress, swapManagerAddress) >= swap.srcAmount, "Not enough allowence for source token!");

        if (dstTokenAddress == address(0)) {
            require(msg.value >= (swap.dstAmount + swapOffer.feeAmount), "Not enough ETH to create swap!");
            swapOffer.srcAddress.transfer(swap.dstAmount);
        } else {
            require(msg.value >= swapOffer.feeAmount, "Not enough ETH to take a swap!");

            ERC20 dstToken = ERC20(dstTokenAddress);
            require(dstToken.allowance(msg.sender, swapManagerAddress) >= swap.dstAmount, "Not enough allowence for destination token!");

            if (!dstToken.transferFrom(msg.sender, swapOffer.srcAddress, swap.dstAmount)) {
                revert SwapFailed();
            }
        }

        if (srcTokenAddress == _wethAddress) {
            require(srcToken.transferFrom(swapOffer.srcAddress, address(this), swap.srcAmount), "Source amount failed to transfer");
            
            _weth.withdraw(swap.srcAmount);
            dstAddress.transfer(swap.srcAmount);
        } else {
            require(srcToken.transferFrom(swapOffer.srcAddress, msg.sender, swap.srcAmount), "Source amount failed to transfer");
        }

        feeAddress.transfer(swapOffer.feeAmount);

        swapOffersTakenByUser[swap.dstAddress].push(swapOfferHash);
        swapsForOffer.push(swap);
    }

    function cancelSwapOffer(bytes32 index) public payable {
        SwapOffer storage swapOffer = swapOffers[index];

        require(swapOffer.srcAddress != address(0), "Non existing swap offer!");
        require(swapOffer.status == SwapStatus.OPENED, "Can't cancel swap offer that is not in OPENED status!");
        require(address(msg.sender) == swapOffer.srcAddress, "Only swap offer initiator can cancel a swap offer!");

        swapOffer.status = SwapStatus.CANCELED;
    }

    function setFeeAddress(address payable newFeeAddress) external {
        require(msg.sender == owner, "Only the contract owner can change the fee address");
        feeAddress = newFeeAddress;
    }

    function setPriceFeed(address newPriceFeedAddress) external {
        require(msg.sender == owner, "Only the contract owner can change the price feed address");
        priceFeed = AggregatorV3Interface(newPriceFeedAddress);
    }

    function getEthUsdPrice() internal view returns (uint256) {
        (,int price,,,) = priceFeed.latestRoundData();
        return uint256(price / 1e8);
    }

    function calculateEthFee() internal view returns (uint256) {
        uint256 ethUsdPrice = getEthUsdPrice();
        uint256 feeInETH = 1e18 / ethUsdPrice; // $1 in ETH
        return feeInETH;
    }

    receive() external payable {}
    fallback() external payable {}
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}
