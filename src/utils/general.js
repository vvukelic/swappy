import { getSwapsForOffer } from "./web3";

export function sliceAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
