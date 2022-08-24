import { ethers } from "ethers";

import abi from "../utils/Keyboards.json"

const contractAddress = '0xBB3cD5f4E342c904d3B8Ec5b43FEe69A9E9103A0';
const contractABI = abi.abi;

export default function getKeyboardsContract(ethereum) {
  if(ethereum) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
  } else {
    return undefined;
  }
}