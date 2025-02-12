require("dotenv").config();
import "antd/dist/antd.css";
// import { Alert } from "antd";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Switch, useHistory } from "react-router-dom";
import "./App.css";
import { Account, Contract, Header } from "./components";
import Footer from "./components/layout/Footer";
import { BLOCKNATIVE_DAPPID, INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor, SafeTransactor } from "./helpers";
import { useBalance, useGasPrice } from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import { Home, Create, Party } from "./routes";
import { useUserProviderAndSigner } from "./hooks";

import { useContractConfig, useContractLoader } from "./hooks";

import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  CloseButton,
  Spacer,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Button,
  MenuItemOption,
  MenuOptionGroup,
  Wrap,
  WrapItem,
  Center,
} from "@chakra-ui/react";
import NotConnectedCard from "./components/Cards/NotConnectedCard";
import NetworkNotifier from "./components/Cards/NetworkNotifier";

import CenteredFrame from "./components/layout/CenteredFrame";
import { useColorMode } from "@chakra-ui/color-mode";
import { MoonIcon, SunIcon, ChevronDownIcon } from "@chakra-ui/icons";

import Onboard from "bnc-onboard";
import { EthersAdapter } from "@gnosis.pm/safe-core-sdk";
const { ethers } = require("ethers");

// let targetNetwork = NETWORKS[process.env.REACT_APP_NETWORK_NAME]; //rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

const DEBUG = false;
const NETWORKCHECK = true;

// Add more networks as the dapp expands to more networks
const configuredNetworks = ["mainnet", "goerli", "rinkeby", "matic"]; //still needs optimism
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  configuredNetworks.push("localhost");
}

const cachedNetwork = window.localStorage.getItem("network");
if (DEBUG) console.log("📡 Connecting to New Cached Network: ", cachedNetwork);
let targetNetwork = NETWORKS[cachedNetwork || process.env.REACT_APP_NETWORK_NAME];

// 🛰 providers

if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const poktMainnetProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider(
      "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
    )
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID

// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = targetNetwork.rpcUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
export const blockExplorer = targetNetwork.blockExplorer;

function App(props) {
  const mainnetProvider =
    poktMainnetProvider && poktMainnetProvider._isProvider
      ? poktMainnetProvider
      : scaffoldEthProvider && scaffoldEthProvider._network
      ? scaffoldEthProvider
      : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  const contractConfig = useContractConfig();

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  const { colorMode, toggleColorMode } = useColorMode();

  const switchNetwork = e => {
    let value = e.target.innerText;
    if (targetNetwork.chainId !== NETWORKS[value].chainId) {
      window.localStorage.setItem("network", value);
      setTimeout(async () => {
        targetNetwork = NETWORKS[value];
        const ethereum = window.ethereum;
        const data = [
          {
            chainId: "0x" + targetNetwork.chainId.toString(16),
            chainName: targetNetwork.name,
            nativeCurrency: targetNetwork.nativeCurrency,
            rpcUrls: [targetNetwork.rpcUrl],
            blockExplorerUrls: [targetNetwork.blockExplorer],
          },
        ];
        console.log("data", data);
        // try to add new chain
        try {
          await ethereum.request({ method: "wallet_addEthereumChain", params: data });
        } catch (error) {
          // if failed, try a network switch instead
          await ethereum
            .request({
              method: "wallet_switchEthereumChain",
              params: [
                {
                  chainId: "0x" + targetNetwork.chainId.toString(16),
                },
              ],
            })
            .catch();
          if (tx) {
            console.log(tx);
          }
        }
        window.location.reload();
      }, 1000);
    }
  };

  const options = [];
  for (const id in NETWORKS) {
    if (configuredNetworks.indexOf(id) > -1) {
      options.push(
        <MenuItemOption type="radio" key={id} value={NETWORKS[id].name} onClick={switchNetwork}>
          {NETWORKS[id].name}
        </MenuItemOption>,
      );
    }
  }

  const networkSelect = (
    <Menu closeOnSelect={false}>
      <MenuButton as={Button} variant="ghost">
        <Text fontSize="sm">
          {targetNetwork.name}
          <ChevronDownIcon />
        </Text>
      </MenuButton>
      <MenuList>
        <MenuOptionGroup value={targetNetwork.name} title="select network" type="radio">
          {options}
        </MenuOptionGroup>
      </MenuList>
    </Menu>
  );

  const [onboard, setOnboard] = useState(null);
  const [notify, setNotify] = useState(null);
  const [wallet, setWallet] = useState({});
  const [isSmartContract, setIsSmartContract] = useState(null);
  const [ethersAdapter, setEthersAdapter] = useState(null);
  let provider;
  useEffect(async () => {
    const onboard = Onboard({
      networkId: Number(process.env.REACT_APP_CHAINID),
      dappId: BLOCKNATIVE_DAPPID,
      walletSelect: {
        wallets: [
          { walletName: "walletConnect", infuraKey: INFURA_ID },
          { walletName: "metamask" },
          { walletName: "gnosis" },
          { walletName: "tally" },
          { walletName: "frame" },
        ],
      },
      subscriptions: {
        address: setAddress,
        wallet: wallet => {
          if (wallet.provider) {
            setWallet(wallet);

            provider = new ethers.providers.Web3Provider(wallet.provider, "any");
            setInjectedProvider(provider);

            provider.on("chainChanged", chainId => {
              console.log(`chain changed to ${chainId}! updating providers`);
              setInjectedProvider(new ethers.providers.Web3Provider(provider, "any"));
            });

            provider.on("accountsChanged", () => {
              console.log(`account changed!`);
              setInjectedProvider(new ethers.providers.Web3Provider(provider, "any"));
            });

            // Subscribe to session disconnection
            provider.on("disconnect", (code, reason) => {
              console.log(code, reason);
              // logoutOfWeb3Modal();
            });

            const adapter = new EthersAdapter({
              ethers,
              signer: provider.getSigner(0),
            });

            setEthersAdapter(adapter);

            window.localStorage.setItem("selectedWallet", wallet.name);
          } else {
            provider = null;
            setWallet({});
          }
        },
      },
    });
    setOnboard(onboard);
  }, []);

  useEffect(() => {
    const previouslySelectedWallet = window.localStorage.getItem("selectedWallet");

    if (previouslySelectedWallet && onboard) {
      onboard.walletSelect(previouslySelectedWallet);
    }
  }, [onboard]);

  useEffect(async () => {
    const bytecode = address && injectedProvider && (await injectedProvider.getCode(address));
    setIsSmartContract(bytecode && bytecode !== "0x");
  }, [address, injectedProvider]);

  //Network Notifier
  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <div>
            You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with HardHat.
            <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
          </div>
        </div>
      );
    } else {
      networkDisplay = (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>
            You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
          </AlertTitle>
          <AlertDescription>
            <div>
              <Button
                onClick={async () => {
                  const ethereum = window.ethereum;
                  const data = [
                    {
                      chainId: "0x" + targetNetwork.chainId.toString(16),
                      chainName: targetNetwork.name,
                      nativeCurrency: targetNetwork.nativeCurrency,
                      rpcUrls: [targetNetwork.rpcUrl],
                      blockExplorerUrls: [targetNetwork.blockExplorer],
                    },
                  ];
                  console.log("data", data);

                  let switchTx;
                  // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                  try {
                    switchTx = await ethereum.request({
                      method: "wallet_switchEthereumChain",
                      params: [{ chainId: data[0].chainId }],
                    });
                  } catch (switchError) {
                    // not checking specific error code, because maybe we're not using MetaMask
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: data,
                      });
                    } catch (addError) {
                      // handle "add" error
                    }
                  }
                  setTimeout(window.location.reload(), 2000);

                  if (switchTx) {
                    console.log("Switch Txn: " + switchTx);
                  }
                }}
              >
                <b>{networkLocal && networkLocal.name}</b>
              </Button>
            </div>
          </AlertDescription>
          <CloseButton position="absolute" right="8px" top="8px" />
        </Alert>
      );
    }
  }

  // The transactor wraps transactions and provides notificiations
  const tx = isSmartContract ? SafeTransactor(userSigner, gasPrice) : Transactor(userSigner, gasPrice);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const history = useHistory();

  const [lb, setLb] = useState(yourLocalBalance);
  useEffect(() => {
    setLb(yourLocalBalance);
  }, [yourLocalBalance]);

  const [partyName, setPartyName] = useState("");
  const [partyJson, setPartyJson] = useState(null);

  return (
    <div id="app-container">
      <Box mb={8} pl={"14vw"} pr={"14vw"}>
        {networkDisplay}
        <Wrap pb={"6vh"}>
          <WrapItem>
            <a href="/">
              <Header />
            </a>
          </WrapItem>
          <Spacer />
          <WrapItem>
            <Box pt={8} pr={2}>
              {networkSelect}
            </Box>
            <Box pt={8} pr={2}>
              <Account
                address={address}
                localProvider={localProvider}
                userSigner={userSigner}
                mainnetProvider={mainnetProvider}
                price={price}
                web3Modal={onboard} //{web3Modal}
                loadWeb3Modal={onboard && onboard.walletSelect} //{loadWeb3Modal}
                logoutOfWeb3Modal={onboard && onboard.walletReset} //{logoutOfWeb3Modal}
                blockExplorer={blockExplorer}
              />
            </Box>
            <Box pt={8}>
              <IconButton
                variant="ghost"
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
              />
            </Box>
          </WrapItem>
        </Wrap>
        {address && address !== "" ? (
          <BrowserRouter>
            <Switch>
              <Route exact path="/">
                <Home
                  address={address}
                  tx={tx}
                  targetNetwork={targetNetwork}
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  mainnetProvider={mainnetProvider}
                  setPartyName={setPartyName}
                  partyName={partyName}
                  partyJson={partyJson}
                  setPartyJson={setPartyJson}
                />
              </Route>
              <Route path="/create">
                <Create
                  address={address}
                  userSigner={userSigner}
                  mainnetProvider={mainnetProvider}
                  localProvider={localProvider}
                  yourLocalBalance={yourLocalBalance}
                  price={price}
                  tx={tx}
                  targetNetwork={targetNetwork}
                  writeContracts={writeContracts}
                  readContracts={readContracts}
                  partyName={partyName}
                  partyJson={partyJson}
                  setPartyJson={setPartyJson}
                />
              </Route>
              <Route path="/party/:id">
                <Party
                  address={address}
                  userSigner={userSigner}
                  targetNetwork={targetNetwork}
                  mainnetProvider={mainnetProvider}
                  localProvider={localProvider}
                  yourLocalBalance={lb}
                  price={price}
                  tx={tx}
                  writeContracts={writeContracts}
                  readContracts={readContracts}
                  isSmartContract={isSmartContract}
                  onboard={onboard}
                />
              </Route>
              <Route exact path="/debug">
                <Contract
                  name="Diplomat"
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                  contractConfig={contractConfig}
                />
              </Route>
            </Switch>
          </BrowserRouter>
        ) : (
          <CenteredFrame>
            <NotConnectedCard />
          </CenteredFrame>
        )}
        <Footer />
      </Box>
    </div>
  );
}

export default App;
