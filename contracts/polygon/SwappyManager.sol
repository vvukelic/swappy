// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../SwappyData.sol";

contract SwappyManager is AccessControl, ReentrancyGuard {
    SwappyData private _dataContract;
    uint256 private _nonce;
    address constant private _wmaticAddress = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
    IWMATIC constant private _wmatic = IWMATIC(_wmaticAddress);
    address payable public _feeAddress;
    AggregatorV3Interface private _priceFeed;
    uint256 private _feeAmountInCents = 100;

    constructor(address dataContractAddress, address payable feeAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _dataContract = SwappyData(dataContractAddress);
        _feeAddress = feeAddress;
        _priceFeed = AggregatorV3Interface(0xAB594600376Ec9fD91F8e885dADF0CE036862dE0);
    }

    event SwapOfferCreated(address indexed creator, bytes32 swapHash);
    error SwapFailed();

    function createSwapOffer(address srcTokenAddress, uint srcAmount, address dstTokenAddress, uint dstAmount, address dstAddress, uint256 expiresIn, bool partialFillEnabled) public payable nonReentrant {
        SwappyData.SwapOffer memory newSwapOffer;

        if (srcTokenAddress == address(0)) {
            require(msg.value >= srcAmount, "Not enough MATIC to create a swap!");

            _wmatic.deposit{value: srcAmount}();
            require(_wmatic.transfer(msg.sender, srcAmount), "WMATIC transfer failed");
            srcTokenAddress = _wmaticAddress;
            newSwapOffer.convertSrcTokenToNative = true;
        } else {
            newSwapOffer.convertSrcTokenToNative = false;
        }

        newSwapOffer.status = SwappyData.SwapStatus.OPENED;
        newSwapOffer.srcAddress = payable(msg.sender);
        newSwapOffer.srcTokenAddress = srcTokenAddress;
        newSwapOffer.srcAmount = srcAmount;
        newSwapOffer.dstTokenAddress = dstTokenAddress;
        newSwapOffer.dstAmount = dstAmount;
        newSwapOffer.dstAddress = dstAddress;
        newSwapOffer.createdTime = block.timestamp;
        newSwapOffer.feeTokenAddress = address(0);
        newSwapOffer.feeAmount = _calculateMaticFee();
        newSwapOffer.partialFillEnabled = partialFillEnabled;

        if (expiresIn > 0) {
            newSwapOffer.expirationTime = block.timestamp + expiresIn;
        } else {
            newSwapOffer.expirationTime = 0;
        }

        bytes32 newSwapOfferHash = keccak256(abi.encode(newSwapOffer, _nonce, msg.sender));

        unchecked {
            _nonce += 1;
        }

        _dataContract.addSwapOffer(newSwapOfferHash, newSwapOffer);
        _dataContract.addUserSwapOffer(address(msg.sender), newSwapOfferHash);

        if (dstAddress != address(0)) {
            _dataContract.addSwapOfferForUser(dstAddress, newSwapOfferHash);
        }

        emit SwapOfferCreated(msg.sender, newSwapOfferHash);
    }

    function createSwapForOffer(bytes32 swapOfferHash, uint partialDstAmount) public payable nonReentrant {
        address swapManagerAddress = address(this);
        SwappyData.SwapOffer memory swapOffer = _dataContract.getSwapOffer(swapOfferHash);
        SwappyData.Swap[] memory swapOfferSwaps = _dataContract.getSwapOfferSwaps(swapOfferHash);

        require(swapOffer.srcAddress != address(0), "Non existing swap offer!");
        require(swapOffer.status == SwappyData.SwapStatus.OPENED, "Can't create swap for offer that is not in OPENED status!");
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
        for (uint i = 0; i < swapOfferSwaps.length; i++) {
            swapsSrcAmountSum += swapOfferSwaps[i].srcAmount;
            swapsDstAmountSum += swapOfferSwaps[i].dstAmount;
        }

        uint remainingDstAmount = swapOffer.dstAmount - swapsDstAmountSum;
        require(partialDstAmount <= remainingDstAmount, "There's not enough resources left in offer for this swap!");

        SwappyData.Swap memory swap;
        swap.dstAddress = payable(msg.sender);
        swap.dstAmount = partialDstAmount;
        swap.closedTime = block.timestamp;
        swap.feeAmount = swapOffer.feeAmount;

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
            require(msg.value >= (swap.dstAmount + swapOffer.feeAmount), "Not enough MATIC to create swap!");
            swapOffer.srcAddress.transfer(swap.dstAmount);
        } else {
            require(msg.value >= swapOffer.feeAmount, "Not enough MATIC to take a swap!");

            ERC20 dstToken = ERC20(dstTokenAddress);
            require(dstToken.allowance(msg.sender, swapManagerAddress) >= swap.dstAmount, "Not enough allowence for destination token!");

            if (!dstToken.transferFrom(msg.sender, swapOffer.srcAddress, swap.dstAmount)) {
                revert SwapFailed();
            }
        }

        if (srcTokenAddress == _wmaticAddress && swapOffer.convertSrcTokenToNative) {
            require(srcToken.transferFrom(swapOffer.srcAddress, address(this), swap.srcAmount), "Source amount failed to transfer");
            _wmatic.withdraw(swap.srcAmount);
            dstAddress.transfer(swap.srcAmount);
        } else {
            require(srcToken.transferFrom(swapOffer.srcAddress, msg.sender, swap.srcAmount), "Source amount failed to transfer");
        }

        _feeAddress.transfer(swap.feeAmount);

        _dataContract.addSwapOfferTakenByUser(swap.dstAddress, swapOfferHash);
        _dataContract.addSwap(swapOfferHash, swap);
    }

    function cancelSwapOffer(bytes32 swapOfferHash) public payable {
        SwappyData.SwapOffer memory swapOffer = _dataContract.getSwapOffer(swapOfferHash);

        require(swapOffer.srcAddress != address(0), "Non existing swap offer!");
        require(swapOffer.status == SwappyData.SwapStatus.OPENED, "Can't cancel swap offer that is not in OPENED status!");
        require(address(msg.sender) == swapOffer.srcAddress, "Only swap offer initiator can cancel a swap offer!");

        _dataContract.updateSwapOfferStatus(swapOfferHash, SwappyData.SwapStatus.CANCELED);
    }

    function setFeeAddress(address payable newFeeAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _feeAddress = newFeeAddress;
    }

    function setPriceFeed(address newPriceFeedAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _priceFeed = AggregatorV3Interface(newPriceFeedAddress);
    }

    function setFeeAmountInCents(uint256 feeAmount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _feeAmountInCents = feeAmount;
    }

    function _calculateMaticFee() private view returns (uint256) {
        (,int maticUsdPrice,,,) = _priceFeed.latestRoundData();
        uint8 decimals = _priceFeed.decimals();
        return (_feeAmountInCents * 1e18) / (uint256(maticUsdPrice) / 10 ** (decimals - 2));
    }

    receive() external payable {}
    fallback() external payable {}
}

interface IWMATIC is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}
