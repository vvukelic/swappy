import { ethers } from 'ethers';

const erc20Abi = require('../contracts/Erc20.json');
const swappyManagerAbi = require('../contracts/SwappyManager.json');
const swappyDataAbi = require('../contracts/SwappyData.json');
const contractAddresses = require('../contracts/contract-address.json');


export class BlockchainUtil {
    constructor(network, provider) {
        this.provider = provider;
        this.network = network;
        this.swappyDataContract = new ethers.Contract(contractAddresses[network.uniqueName].SwappyData, swappyDataAbi, this.provider.getSigner());
        this.swappyManagerContract = new ethers.Contract(contractAddresses[network.uniqueName].SwappyManager, swappyManagerAbi, this.provider.getSigner());
    }

    async switchNetwork(network) {
        try {
            await this.provider.send('wallet_switchEthereumChain', [{ chainId: '0x' + network.chainId.toString(16) }]);
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await this.provider.send('wallet_addEthereumChain', [
                        {
                            chainId: '0x' + network.chainId.toString(16),
                            chainName: network.chainName,
                            rpcUrls: network.rpcUrls,
                            nativeCurrency: network.nativeCurrency,
                            blockExplorerUrls: network.blockExplorerUrls,
                        },
                    ]);
                } catch (addError) {
                    // Handle errors when adding a new network
                    console.error('Failed to add the network:', addError);
                }
            } else {
                console.error('Failed to switch networks:', switchError);
            }
        }
    }

    async getNativeTokenBalance(address) {
        if (!address) return null;

        try {
            let balance = await this.provider.getBalance(address);
            return balance;
        } catch (error) {
            console.error('Error fetching balance:', error);
            return null;
        }
    }

    async getErc20TokenBalance(accountAddress, tokenContractAddress) {
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, this.provider);

        try {
            const balance = await tokenContract.balanceOf(accountAddress);
            return balance;
        } catch (error) {
            console.error('Error getting ERC20 token balance:', error);
            throw error;
        }
    }

    async getTokenBalance(accountAddress, tokenContractAddress) {
        let tokenBalance = null;

        if (tokenContractAddress === ethers.constants.AddressZero) {
            tokenBalance = await this.getNativeTokenBalance(accountAddress);
        } else {
            tokenBalance = await this.getErc20TokenBalance(accountAddress, tokenContractAddress);
        }

        return tokenBalance;
    }

    async getTokenDecimals(tokenContractAddress) {
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, this.provider);
        let decimals;

        try {
            decimals = await tokenContract.decimals();
        } catch (error) {
            console.error('Error getting token decimals:', error);
            throw error;
        }

        return decimals;
    }

    async toSmallestUnit(amount, tokenContractAddress) {
        let decimals = null;

        if (tokenContractAddress === ethers.constants.AddressZero) {
            decimals = 18;
        } else {
            decimals = await this.getTokenDecimals(tokenContractAddress);
        }

        return ethers.utils.parseUnits(amount, decimals);
    }

    async toBaseUnit(amount, tokenContractAddress) {
        let decimals = null;

        if (tokenContractAddress === ethers.constants.AddressZero) {
            decimals = 18;
        } else {
            decimals = await this.getTokenDecimals(tokenContractAddress);
        }

        return ethers.utils.formatUnits(amount, decimals);
    }

    async getCurrentBlockTimestamp() {
        const blockNumber = await this.provider.getBlockNumber();
        const block = await this.provider.getBlock(blockNumber);
        return block.timestamp;
    }

    async getSwappyAllowance(tokenContractAddress, ownerAddress) {
        try {
            const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, this.provider);
            return await tokenContract.allowance(ownerAddress, this.swappyManagerContract.address);
        } catch (error) {
            console.error('Error checking allowance:', error);
        }
    }

    async getTokenName(tokenContractAddress) {
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, this.provider);
        let name;

        try {
            name = await tokenContract.name();
        } catch (error) {
            console.error('Error getting token name:', error);
            throw error;
        }

        return name;
    }

    async getTokenSymbol(tokenContractAddress) {
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, this.provider);
        let symbol;

        try {
            symbol = await tokenContract.symbol();
        } catch (error) {
            console.error('Error getting token symbol:', error);
            throw error;
        }

        return symbol;
    }

    async getTokenDecimals(tokenContractAddress) {
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, this.provider);
        let decimals;

        try {
            decimals = await tokenContract.decimals();
        } catch (error) {
            console.error('Error getting token decimals:', error);
            throw error;
        }

        return decimals;
    }

    async approveTokenForSwappy(tokenContractAddress) {
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, this.provider.getSigner());

        try {
            const tx = await tokenContract.approve(this.swappyManagerContract.address, ethers.constants.MaxUint256);
            return tx;
        } catch (error) {
            console.error('Error approving token:', error);
            throw error;
        }
    }

    async createSwapOffer(srcTokenAddress, srcAmount, dstTokenAddress, dstAmount, dstAddress, expiresIn, partialFillEnabled) {
        let ethValue = 0;

        if (srcTokenAddress === ethers.constants.AddressZero) {
            ethValue = srcAmount;
        }

        try {
            const tx = await this.swappyManagerContract.createSwapOffer(srcTokenAddress, srcAmount, dstTokenAddress, dstAmount, dstAddress, expiresIn, partialFillEnabled, { value: ethValue });
            return tx;
        } catch (error) {
            console.error('Error creating swap', error);
            throw error;
        }
    }

    async getSwapOffer(swapOfferHash) {
        const swapOffer = await this.swappyDataContract.getSwapOffer(swapOfferHash);
        return swapOffer;
    }

    async getSwapsForOffer(swapOfferHash) {
        const swapsForOffer = await this.swappyDataContract.getSwapOfferSwaps(swapOfferHash);
        return swapsForOffer;
    }

    async getUserSwapOffers(userAddress) {
        try {
            const swapOffersHashes = await this.swappyDataContract.getUserSwapOffers(userAddress);
            return swapOffersHashes;
        } catch (error) {
            console.error('Error fetching user swaps:', error);
            return [];
        }
    }

    async getSwapOffersForUser(userAddress) {
        try {
            const swapOffersHashes = await this.swappyDataContract.getSwapOffersForUser(userAddress);
            return swapOffersHashes;
        } catch (error) {
            console.error('Error fetching destination user swaps:', error);
            return [];
        }
    }

    async getSwapOffersTakenByUser(userAddress) {
        try {
            const swapOffersHashes = await this.swappyDataContract.getSwapOffersTakenByUser(userAddress);
            return swapOffersHashes;
        } catch (error) {
            console.error('Error fetching swap offers taken by user:', error);
            return [];
        }
    }

    async createSwapForOffer(swapHash, dstTokenAddress, dstAmount, feeAmount) {
        try {
            let nativeTokenAmount = 0;

            if (dstTokenAddress === ethers.constants.AddressZero) {
                nativeTokenAmount = dstAmount;
            }

            const tx = await this.swappyManagerContract.createSwapForOffer(swapHash, dstAmount, { value: feeAmount.add(nativeTokenAmount) });
            return tx;
        } catch (error) {
            console.error('Error taking the swap:', error);
            throw error;
        }
    }

    async cancelSwapOffer(swapHash) {
        try {
            const tx = await this.swappyManagerContract.cancelSwapOffer(swapHash);
            return tx;
        } catch (error) {
            console.error('Error canceling the swap:', error);
            throw error;
        }
    }
}

export async function waitForTxToBeMined(tx) {
    try {
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error('Transaction error:', error);
        throw error;
    }
}
