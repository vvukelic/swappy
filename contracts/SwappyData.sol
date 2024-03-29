// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract SwappyData is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    enum SwapStatus { OPENED, CANCELED }

    struct Swap {
        address payable dstAddress;

        uint srcAmount;
        uint dstAmount;
        uint feeAmount;

        uint256 closedTime;
    }

    struct SwapOffer {
        address payable srcAddress;
        address dstAddress;
        
        address srcTokenAddress;
        uint srcAmount;
        address dstTokenAddress;
        uint dstAmount;
        address feeTokenAddress;
        uint feeAmount;

        uint256 createdTime;
        uint256 expirationTime;

        bool partialFillEnabled;

        SwapStatus status;
    }

    bytes32[] private _allSwapOffers;
    mapping(bytes32 => SwapOffer) private _swapOffers;
    mapping(bytes32 => Swap[]) private _swapOfferSwaps;
    mapping(address => bytes32[]) private _userSwapOffers;
    mapping(address => bytes32[]) private _swapOffersForUser;
    mapping(address => bytes32[]) private _swapOffersTakenByUser;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addManager(address newManager) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANAGER_ROLE, newManager);
    }

    function removeManager(address manager) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MANAGER_ROLE, manager);
    }

    function getTotalSwapOffers() public view returns (uint) {
        return _allSwapOffers.length;
    }

    function getSwapOffersRange(uint startIndex, uint endIndex) public view returns (bytes32[] memory) {
        require(startIndex < endIndex, "Invalid index range");
        require(endIndex <= _allSwapOffers.length, "Index out of bounds");

        bytes32[] memory rangeSwapOffers = new bytes32[](endIndex - startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            rangeSwapOffers[i - startIndex] = _allSwapOffers[i];
        }
        return rangeSwapOffers;
    }

    function getSwapOffer(bytes32 swapOfferHash) public view returns (SwapOffer memory) {
        return _swapOffers[swapOfferHash];
    }

    function getSwapOfferSwaps(bytes32 swapOfferHash) public view returns (Swap[] memory) {
        return _swapOfferSwaps[swapOfferHash];
    }

    function getUserSwapOffers(address userAddress) public view returns (bytes32[] memory) {
        return _userSwapOffers[userAddress];
    }

    function getSwapOffersForUser(address userAddress) public view returns (bytes32[] memory) {
        return _swapOffersForUser[userAddress];
    }

    function getSwapOffersTakenByUser(address userAddress) public view returns (bytes32[] memory) {
        return _swapOffersTakenByUser[userAddress];
    }

    function addSwapOffer(bytes32 swapOfferHash, SwapOffer memory swapOffer) external onlyRole(MANAGER_ROLE) {
        _allSwapOffers.push(swapOfferHash);
        _swapOffers[swapOfferHash] = swapOffer;
    }

    function addSwap(bytes32 swapOfferHash, Swap memory swap) external onlyRole(MANAGER_ROLE) {
        require(_swapOffers[swapOfferHash].srcAddress != address(0), "Non existing swap offer!");
        _swapOfferSwaps[swapOfferHash].push(swap);
    }

    function addUserSwapOffer(address userAddress, bytes32 swapOfferHash) external onlyRole(MANAGER_ROLE) {
        _userSwapOffers[userAddress].push(swapOfferHash);
    }

    function addSwapOfferForUser(address userAddress, bytes32 swapOfferHash) external onlyRole(MANAGER_ROLE) {
        _swapOffersForUser[userAddress].push(swapOfferHash);
    }

    function addSwapOfferTakenByUser(address userAddress, bytes32 swapOfferHash) external onlyRole(MANAGER_ROLE) {
        _swapOffersTakenByUser[userAddress].push(swapOfferHash);
    }

    function updateSwapOfferStatus(bytes32 swapOfferHash, SwapStatus newStatus) external onlyRole(MANAGER_ROLE) {
        require(_swapOffers[swapOfferHash].srcAddress != address(0), "Non existing swap offer!");
        _swapOffers[swapOfferHash].status = newStatus;
    }
}
