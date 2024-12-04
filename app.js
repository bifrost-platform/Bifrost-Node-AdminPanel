import { ethers } from 'ethers';

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

async function initContract() {
    if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
    return contract;
}

class WalletConnector {
    constructor() {
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

        await initContract();
        await this.updateCurrentNetwork();

        if (window.ethereum) {
            window.ethereum.on('chainChanged', async () => {
                await initContract();
                this.updateCurrentNetwork();
            });
        }
    }

    setupEventListeners() {
        this.connectButton.addEventListener('click', () => this.connectWallet());
        this.bondingButton.addEventListener('click', () => this.handleTransaction());
        this.bondMoreButton.addEventListener('click', () => this.handleBondMore());
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
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            this.account = accounts[0];
            this.accountAddress.textContent = this.account;
            this.walletInfo.classList.remove('hidden');
            this.connectButton.classList.add('hidden');
            
            console.log('Wallet connected, updating network status...');
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
            console.error('Failed to connect wallet:', error);
            alert('Failed to connect wallet.');
        }
    }

    disconnectWallet() {
        this.account = null;
        this.accountAddress.textContent = '';
        this.walletInfo.classList.add('hidden');
        this.connectButton.classList.remove('hidden');
    }

    async handleTransaction() {
        try {
            const controller = document.getElementById('controller').value;
            const relayer = document.getElementById('relayer').value;
            const amount = document.getElementById('bondingAmount').value;
            const candidateCount = 1000;

            if (!controller || !relayer || !amount) {
                alert('Please fill in all fields.');
                return;
            }

            if (!ethers.isAddress(controller)) {
                alert('Invalid controller address.');
                return;
            }

            if (!ethers.isAddress(relayer)) {
                alert('Invalid relayer address.');
                return;
            }

            if (!contract) {
                await initContract();
            }

            const amountInWei = ethers.parseEther(amount.toString());

            const tx = await contract.join_candidates(
                controller,
                relayer,
                amountInWei,
                candidateCount
            );

            console.log('Transaction sent:', tx.hash);
            alert('Transaction sent. Please wait for processing.');

            await tx.wait();
            console.log('Transaction confirmed');
            alert('Transaction completed!');
            
            this.bondingButton.disabled = true;
            this.bondingAmount.disabled = true;
            this.relayer.disabled = true;
            this.controller.disabled = true;

            this.additionalAmount.disabled = false;
            this.bondMoreButton.disabled = false;

            const states = await contract.candidate_states(0);
            const candidates = states[1].map(addr => addr.toLowerCase());

            const stakeAmounts = states[2][candidates.indexOf(this.account.toLowerCase())];

            this.validationStatus.textContent = `[Stake amount: ${stakeAmounts}]`;
            this.validationStatus.classList.remove('invalid');
            this.validationStatus.classList.add('valid');

        } catch (error) {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
        }
    }

    async handleBondMore() {
        try {
            const amount = document.getElementById('additionalAmount').value;

            if (!amount) {
                alert('Please enter an amount.');
                return;
            }

            if (!contract) {
                await initContract();
            }

            const amountInWei = ethers.parseEther(amount.toString());

            const tx = await contract.candidate_bond_more(amountInWei);

            console.log('Transaction sent:', tx.hash);
            alert('Transaction sent. Please wait for processing.');

            await tx.wait();
            console.log('Transaction confirmed');
            alert('Bond more transaction completed!');

        } catch (error) {
            console.error('Bond more transaction failed:', error);
            alert('Transaction failed: ' + error.message);
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
        if (window.ethereum) {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                this.networkName.textContent = chainId;

                this.validationStatus.textContent = '';
                this.validationStatus.style.display = 'none';
                
                this.additionalAmount.value = '';
                this.bondingAmount.value = '';
                this.relayer.value = '';
                this.controller.value = '';
                this.bondingButton.disabled = !this.bondingAmount.value;

                if ((chainId === '0xbfc0' || chainId === '0xbfc') && this.account) {
                    if (!contract) {
                        await initContract();
                    }
                    
                    try {
                        const states = await contract.candidate_states(0);
                        const candidates = states[1].map(addr => addr.toLowerCase());

                        const isValid = candidates.includes(this.account.toLowerCase());

                        if (isValid) {
                            const stakeAmounts = states[2][candidates.indexOf(this.account.toLowerCase())];

                            this.validationStatus.textContent = `[Stake amount: ${stakeAmounts}]`;
                            this.validationStatus.classList.remove('invalid');
                            this.validationStatus.classList.add('valid');
                        } else {
                            this.validationStatus.textContent = '[Stake amount: 0]';
                            this.validationStatus.classList.remove('valid');
                            this.validationStatus.classList.add('invalid');
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