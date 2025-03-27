import { ethers } from 'ethers';
import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet } from 'viem/chains'

localStorage.clear();

const projectId = '31ff83650935a14be97f541529150d8f'

const metadata = {
  name: 'AppKit',
  description: 'AppKit Example',
  url: 'https://reown.com/appkit', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

const BifrostMainnet = {
    id: 0xbfc,
    name: 'Bifrost',
    network: 'bifrost',
    nativeCurrency: {
        decimals: 18,
        name: 'BFC',
        symbol: 'BFC',
    },
    rpcUrls: {
        public: { http: ['https://public-01.mainnet.bifrostnetwork.com/rpc'] },
        default: { http: ['https://public-01.mainnet.bifrostnetwork.com/rpc'] },
    },
    blockExplorers: {
        default: { name: 'BifrostScan', url: 'https://explorer.mainnet.bifrostnetwork.com/' },
    }
}

// Bifrost Testnet 네트워크 설정
const BifrostTestnet = {
    id: 0xbfc0,
    name: 'Bifrost Testnet',
    network: 'bifrost-testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'BFC',
        symbol: 'BFC',
    },
    rpcUrls: {
        public: { http: ['https://public-01.testnet.bifrostnetwork.com/rpc'] },
        default: { http: ['https://public-01.testnet.bifrostnetwork.com/rpc'] },
    },
    blockExplorers: {
        default: { name: 'BifrostScan Testnet', url: 'https://explorer.testnet.bifrostnetwork.com/' },
    }
}

const modal = createAppKit({
  adapters: [new EthersAdapter()],
//   networks: [BifrostMainnet, BifrostTestnet],
    networks: [BifrostMainnet, BifrostTestnet, mainnet],
  metadata,
  projectId,
  features: {
    connectMethodsOrder: ['wallet'],
  }
});


const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000400';
const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tier",
                "type": "uint256"
            }
        ],
        "name": "candidate_states",
        "outputs": [
        {"type": "address[]"},
        {"type": "address[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "bool[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"},
        {"type": "uint256[]"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "controller",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "relayer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "candidateCount",
                "type": "uint256"
            }
        ],
        "name": "join_candidates",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "more",
                "type": "uint256"
            }
        ],
        "name": "candidate_bond_more",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
];

let contract = null;

class WalletConnector {
    constructor() {
        this.flag = false;
        this.provider = null;
        this.account = null;
        this.networkConfig = {
            chainId: '0xBFC0',
            chainName: 'Bifrost Testnet',
            rpcUrls: ['https://public-01.testnet.bifrostnetwork.com/rpc'],
            nativeCurrency: {
                name: 'BFC',
                symbol: 'BFC',
                decimals: 18
            },
            blockExplorerUrls: ['https://explorer.testnet.bifrostnetwork.com/']
        };
        
        this.mainnetConfig = {
            chainId: '0xBFC',
            chainName: 'Bifrost Mainnet',
            rpcUrls: ['https://public-01.mainnet.bifrostnetwork.com/rpc'],
            nativeCurrency: {
                name: 'BFC',
                symbol: 'BFC',
                decimals: 18
            },
            blockExplorerUrls: ['https://explorer.mainnet.bifrostnetwork.com/']
        };
        
        this.logMessages = null;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        this.metamaskStatus = document.getElementById('metamaskStatus');
        this.walletSection = document.getElementById('walletSection');
        this.connectButton = document.getElementById('connectButton');
        this.walletConnectButton = document.getElementById('walletConnectButton');
        this.walletInfo = document.getElementById('walletInfo');
        this.accountAddress = document.getElementById('accountAddress');
        this.controller = document.getElementById('controller');
        this.relayer = document.getElementById('relayer');
        this.bondingAmount = document.getElementById('bondingAmount');
        this.bondingButton = document.getElementById('bondingButton');
        this.addNetworkButton = document.getElementById('addNetworkButton');
        this.switchNetworkButton = document.getElementById('switchNetworkButton');
        this.networkName = document.getElementById('networkName');
        this.validationStatus = document.getElementById('validationStatus');
        this.additionalAmount = document.getElementById('additionalAmount');
        this.bondMoreButton = document.getElementById('bondMoreButton');
        this.addMainnetButton = document.getElementById('addMainnetButton');
        this.switchMainnetButton = document.getElementById('switchMainnetButton');
        this.logMessages = document.getElementById('logMessages');
        this.disconnectButton = document.getElementById('disconnectButton');

        await this.checkMetaMaskInstallation();
        
        if (this.connectButton) {
            this.setupEventListeners();
        }
        if (this.addNetworkButton) {
            this.addNetworkButton.addEventListener('click', () => this.addNetwork());
        }
        if (this.switchNetworkButton) {
            this.switchNetworkButton.addEventListener('click', () => this.switchNetwork());
        }
        if (this.addMainnetButton) {
            this.addMainnetButton.addEventListener('click', () => this.addMainnet());
        }
        if (this.switchMainnetButton) {
            this.switchMainnetButton.addEventListener('click', () => this.switchMainnet());
        }
        if (this.disconnectButton) {
            this.disconnectButton.addEventListener('click', () => this.disconnectWallet());
        }

        await this.updateCurrentNetwork();

        if (window.ethereum) {
            window.ethereum.on('chainChanged', async () => {
                await this.initContract();
                this.updateCurrentNetwork();
            });
        }
    }

    setupEventListeners() {
        this.connectButton.addEventListener('click', () => this.connectWallet());
        this.bondingButton.addEventListener('click', () => this.handleTransaction());
        this.bondMoreButton.addEventListener('click', () => this.handleBondMore());
        this.walletConnectButton.addEventListener('click', () => this.walletConnect());
    }

    async initContract() {
        if (this.provider) {
            const signer = await this.provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        }
        return contract;
    }

    async checkMetaMaskInstallation() {
        console.log("Checking MetaMask installation...");
        if (typeof window.ethereum !== 'undefined') {
            console.log("MetaMask is installed");
            this.metamaskStatus.innerHTML = 'MetaMask is installed';
            this.metamaskStatus.classList.add('installed');
            this.walletSection.classList.remove('hidden');
        } else {
            console.log("MetaMask is not installed");
            this.metamaskStatus.innerHTML = `
                <p>MetaMask is not installed.</p>
                <a href="https://metamask.io/download/" target="_blank">Install MetaMask</a>
            `;
            this.metamaskStatus.classList.add('not-installed');
        }
    }

    async connectWallet() {
        try {
            // MetaMask가 설치되어 있지 않으면 WalletConnect를 사용하도록 안내
            if (typeof window.ethereum === 'undefined') {
                alert('MetaMask가 설치되어 있지 않습니다. WalletConnect를 사용해주세요.');
                return;
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.account = accounts[0];
            this.accountAddress.textContent = this.account;
            this.walletInfo.classList.remove('hidden');
            this.connectButton.classList.add('hidden');

            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.flag = false;
                        
            await this.updateCurrentNetwork();
            
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.account = accounts[0];
                    this.accountAddress.textContent = this.account;
                    await this.updateCurrentNetwork();
                }
            });

        } catch (error) {
            console.error('지갑 연결 실패:', error);
            alert('지갑 연결에 실패했습니다.');
        }
    }

    async walletConnect() {
        try {
            // WalletConnect 모달 열기
            await modal.open();
            
            // 연결될 때까지 대기
            while (!modal.getAddress()) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // 연결된 후 provider와 account 설정
            this.provider = new ethers.BrowserProvider(modal.getWalletProvider());
            this.account = modal.getAddress();

            // UI 업데이트
            this.accountAddress.textContent = this.account;
            this.walletInfo.classList.remove('hidden');
            this.connectButton.classList.add('hidden');
            this.flag = true;
            
            await this.updateCurrentNetwork();

        } catch (error) {
            console.error('WalletConnect 연결 실패:', error);
            alert('WalletConnect 연결에 실패했습니다.');
        }
    }

    async disconnectWallet() {
        this.account = null;
        this.accountAddress.textContent = '';
        this.walletInfo.classList.add('hidden');
        this.connectButton.classList.remove('hidden');
        
        // Reset form fields
        this.bondingAmount.value = '';
        this.relayer.value = '';
        this.controller.value = '';
        this.additionalAmount.value = '';
        
        // Reset validation status
        this.validationStatus.textContent = '';
        this.validationStatus.style.display = 'none';
        
        // Disable all transaction buttons
        this.bondingButton.disabled = true;
        this.bondingAmount.disabled = true;
        this.relayer.disabled = true;
        this.controller.disabled = true;
        this.additionalAmount.disabled = true;
        this.bondMoreButton.disabled = true;

        await modal.disconnect();
        
        this.addLog('Wallet disconnected');
    }

    getExplorerUrl(hash) {
        const chainId = window.ethereum.chainId;
        let baseUrl;
        
        if (chainId === '0xbfc') {
            baseUrl = 'https://explorer.mainnet.bifrostnetwork.com/tx/';
        } else if (chainId === '0xbfc0') {
            baseUrl = 'https://explorer.testnet.bifrostnetwork.com/tx/';
        } else {
            return null;
        }
        
        return baseUrl + hash;
    }

    addLog(message, isError = false, hash = null) {
        const logEntry = document.createElement('div');
        
        if (hash) {
            const explorerUrl = this.getExplorerUrl(hash);
            if (explorerUrl) {
                logEntry.innerHTML = `${new Date().toLocaleTimeString()}: ${message} <a href="${explorerUrl}" target="_blank">${hash}</a>`;
            } else {
                logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message} ${hash}`;
            }
        } else {
            logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        }
        
        logEntry.style.color = isError ? 'red' : 'green';
        this.logMessages.appendChild(logEntry);
        this.logMessages.scrollTop = this.logMessages.scrollHeight;
        this.logMessages.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    async handleTransaction() {
        try {
            const controller = document.getElementById('controller').value;
            let relayer = document.getElementById('relayer').value;
            const amount = document.getElementById('bondingAmount').value;
            const candidateCount = 1000;

            if (!controller || !amount) {
                alert('Please fill in controller and bonding amount fields.');
                return;
            }

            if (!ethers.isAddress(controller)) {
                alert('Invalid controller address.');
                return;
            }

            if (!ethers.isAddress(relayer)) {
                relayer = ethers.ZeroAddress;
            }

            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            const amountInWei = ethers.parseEther(amount.toString());

            const tx = await contract.join_candidates(
                controller,
                relayer,
                amountInWei,
                candidateCount
            );

            this.addLog('Transaction sent:', false, tx.hash, '\nPlease wait for confirmation...');

            this.bondingButton.disabled = true;
            this.bondingAmount.disabled = true;
            this.relayer.disabled = true;
            this.controller.disabled = true;

            await tx.wait();
            this.addLog('Transaction confirmed!');

            this.additionalAmount.disabled = false;
            this.bondMoreButton.disabled = false;

            const states = await contract.candidate_states(0);
            const candidates = states[1].map(addr => addr.toLowerCase());

            const stakeAmounts = states[2][candidates.indexOf(this.account.toLowerCase())];
            const formattedAmount = ethers.formatEther(stakeAmounts);
            this.validationStatus.textContent = `[Stake amount: ${formattedAmount} BFC]`;
            this.validationStatus.classList.remove('invalid');
            this.validationStatus.classList.add('valid');

        } catch (error) {
            console.error('Transaction failed:', error);
            this.addLog('Transaction failed: ' + error.message, true);

            this.bondingButton.disabled = false;
            this.bondingAmount.disabled = false;
            this.relayer.disabled = false;
            this.controller.disabled = false;
        }
    }

    async handleBondMore() {
        try {
            const amount = document.getElementById('additionalAmount').value;

            if (!amount) {
                alert('Please enter an amount.');
                return;
            }

            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            const amountInWei = ethers.parseEther(amount.toString());

            const tx = await contract.candidate_bond_more(amountInWei);

            this.addLog('Bond more transaction sent:', false, tx.hash, '\nPlease wait for confirmation...');

            await tx.wait();
            this.addLog('Bond more transaction confirmed!');
            
            const states = await contract.candidate_states(0);
            const candidates = states[1].map(addr => addr.toLowerCase());

            const stakeAmounts = states[2][candidates.indexOf(this.account.toLowerCase())];
            const formattedAmount = ethers.formatEther(stakeAmounts);
            this.validationStatus.textContent = `[Stake amount: ${formattedAmount} BFC]`;
            this.validationStatus.classList.remove('invalid');
            this.validationStatus.classList.add('valid');

        } catch (error) {
            console.error('Bond more transaction failed:', error);
            this.addLog('Bond more transaction failed: ' + error.message, true);
        }
    }

    async addNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [this.networkConfig],
            });
            alert('Bifrost Testnet has been successfully added!');
        } catch (error) {
            console.error('Failed to add network:', error);
            alert('Failed to add network.');
        }
    }

    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.networkConfig.chainId }],
            });
            alert('Switched to Bifrost Testnet!');
        } catch (error) {
            console.error('Failed to switch network:', error);
            alert('Failed to switch network.');
        }
    }

    async addMainnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [this.mainnetConfig],
            });
            alert('Bifrost Mainnet has been successfully added!');
        } catch (error) {
            console.error('Failed to add mainnet:', error);
            alert('Failed to add mainnet.');
        }
    }

    async switchMainnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.mainnetConfig.chainId }],
            });
            alert('Switched to Bifrost Mainnet!');
        } catch (error) {
            console.error('Failed to switch network:', error);
            alert('Failed to switch network.');
        }
    }

    async updateCurrentNetwork() {
        if (this.provider) {
            try {
                let chainId;

                if (this.flag) {
                    chainId = modal.getChainId();
                } else {
                    chainId = await window.ethereum.request({ method: 'eth_chainId' });
                }

                let networkDisplayName;
                if (chainId === '0xbfc' || chainId === 3068) {
                    networkDisplayName = 'Bifrost Mainnet';
                } else if (chainId === '0xbfc0' || chainId === 49088) {
                    networkDisplayName = 'Bifrost Testnet';
                } else {
                    networkDisplayName = chainId;
                }
                this.networkName.textContent = networkDisplayName;

                this.validationStatus.textContent = '';
                this.validationStatus.style.display = 'none';
                
                this.additionalAmount.value = '';
                this.bondingAmount.value = '';
                this.relayer.value = '';
                this.controller.value = '';
                this.bondingButton.disabled = !this.bondingAmount.value;

                if ((chainId === '0xbfc0' || chainId === '0xbfc' || chainId === 49088 || chainId === 3068) && this.account) {
                    await this.initContract();
                    try {
                        const states = await contract.candidate_states(0);
                        const candidates = states[1].map(addr => addr.toLowerCase());

                        const isValid = candidates.includes(this.account.toLowerCase());
                        if (isValid) {
                            const stakeAmounts = states[2][candidates.indexOf(this.account.toLowerCase())];
                            const formattedAmount = ethers.formatEther(stakeAmounts);
                            this.validationStatus.textContent = `[Stake amount: ${formattedAmount} BFC]`;
                            this.validationStatus.classList.remove('invalid');
                            this.validationStatus.classList.add('valid');
                        } else {
                            this.validationStatus.textContent = '[Stake amount: 0 BFC]';
                            this.validationStatus.classList.remove('invalid');
                            this.validationStatus.classList.add('valid');
                        }
                        this.validationStatus.style.display = 'inline';

                        if (isValid) {
                            this.bondingButton.disabled = true;
                            this.bondingAmount.disabled = true;
                            this.relayer.disabled = true;
                            this.controller.disabled = true;
                            this.additionalAmount.disabled = false;
                            this.bondMoreButton.disabled = false;
                        } else {
                            this.bondingButton.disabled = false;
                            this.bondingAmount.disabled = false;
                            this.relayer.disabled = false;
                            this.controller.disabled = false;
                            this.additionalAmount.disabled = true;
                            this.bondMoreButton.disabled = true;
                        }

                        
                    } catch (error) {
                        console.error('Failed to check candidate states:', error);
                    }
                } else {
                    this.validationStatus.textContent = '[Not on Bifrost]';
                    this.validationStatus.classList.remove('valid');
                    this.validationStatus.classList.add('invalid');
                    this.validationStatus.style.display = 'inline';
                }
            } catch (error) {
                console.error('Failed to get network information:', error);
                this.networkName.textContent = 'No network information';
            }
        } else {
            this.networkName.textContent = 'MetaMask not connected';
        }
    }
}

new WalletConnector(); 