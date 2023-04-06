import { ethers } from "ethers"

let provider = null;

try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
} catch (error) {
}

export default provider;
