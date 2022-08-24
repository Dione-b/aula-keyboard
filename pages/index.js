import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { UserCircleIcon } from "@heroicons/react/solid"
import { toast } from "react-hot-toast"
import PrimaryButton from "../components/primary-button";
import Keyboard from "../components/keyboard";
import abi from "../utils/Keyboards.json"
import addressesEqual from "../utils/addressesEqual";
import TipButton from "../components/tip-button";
import getKeyboardsContract from "../utils/getKeyboardsContract";

export default function Home() {

  const [ethereum, setEthereum] = useState(undefined);
  const [connectedAccount, setConnectedAccount] = useState(undefined);
  const [keyboards, setKeyboards] = useState([]);
  const [newKeyboard, setNewKeyboard] = useState("");
  const [keyboardsLoading, setKeyboardsLoading] = useState(false);

  const keyboardsContract = getKeyboardsContract(ethereum);
  const contractAddress = '0xBB3cD5f4E342c904d3B8Ec5b43FEe69A9E9103A0';
  const contractABI = abi.abi;

  const getKeyboards = async () => {
    if (keyboardsContract && connectedAccount) {
      setKeyboardsLoading(true);
      try {
        const keyboards = await keyboardsContract.getKeyboards();
        console.log('Retrieved keyboards...', keyboards)
  
        setKeyboards(keyboards)
      } finally {
        setKeyboardsLoading(false);
      }
    }
  }
  useEffect(() => getKeyboards(), [!!keyboardsContract, connectedAccount]);

  const addContractEventHandlers = () => {
    if (keyboardsContract && connectedAccount) {
      keyboardsContract.on('KeyboardCreated', async (keyboard) => {
        if (connectedAccount && !addressesEqual(keyboard.owner, connectedAccount)) {
          toast('Somebody created a new keyboard!', { id: JSON.stringify(keyboard) })
        }
        await getKeyboards();
      })
    }
  }
  useEffect(addContractEventHandlers, [!!keyboardsContract, connectedAccount]);
  
  const handleAccounts = (accounts) => {
    if (accounts.length > 0) {
      const account = accounts[0];
      console.log('We have an authorized account: ', account);
      setConnectedAccount(account);
    } else {
      console.log("No authorized accounts yet")
    }
  };
  
  const getConnectedAccount = async () => {
    if (window.ethereum) {
      setEthereum(window.ethereum);
    }
  
    if (ethereum) {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      handleAccounts(accounts);
    }
  };
  useEffect(() => getConnectedAccount(), []);
  
  const connectAccount = async () => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    handleAccounts(accounts);
  };

  const submitCreate = async (e) => {
    e.preventDefault();

    if (!ethereum) {
      console.error('Ethereum object is required to create a keyboard');
      return;
    }

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const keyboardsContract = new ethers.Contract(contractAddress, contractABI, signer);

    const createTxn = await keyboardsContract.create(newKeyboard);
    console.log('Create transaction started...', createTxn.hash);

    await createTxn.wait();
    console.log('Created keyboard!', createTxn.hash);

    await getKeyboards();
  }
  
  if (!ethereum) {
    return <p>Please install MetaMask to connect to this site</p>
  }

  if (!connectedAccount) {
    return <PrimaryButton onClick={connectAccount}>Connect MetaMask Wallet</PrimaryButton>
  }
  
  if (keyboards.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <PrimaryButton type="link" href="/create">Create a Keyboard!</PrimaryButton>
        <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
          {keyboards.map(
            ([kind, isPBT, filter, owner], i) => (
              <div key={i} className="relative">
                <Keyboard kind={kind} isPBT={isPBT} filter={filter} />
                <span className="absolute top-1 right-6">
                  {addressesEqual(owner, connectedAccount) ?
                    <UserCircleIcon className="w-5 h-5 text-indigo-100" /> :
                    <TipButton ethereum={ethereum} index={i} />
                  }
                </span>
              </div>
            )
          )}
        </div>
      </div>
    )
  }


  // No keyboards yet
  return (
    <div className="flex flex-col gap-4">
      <PrimaryButton type="link" href="/create">Create a Keyboard!</PrimaryButton>
      <p>No keyboards yet!</p>
    </div>
  )
}