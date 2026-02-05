import { ethers } from 'ethers';
import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet } from 'viem/chains'
import CONTRACT_ABI from './abi.json';

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
        public: { http: ['http://10.100.0.94:9944'] },
        default: { http: ['http://10.100.0.94:9944'] },
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
  },
  enableInjected: false
});


const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000400';

let contract = null;

class WalletConnector {
    constructor() {
        this.connectionType = null; // 'metamask' or 'walletconnect' or null
        this.provider = null;
        this.account = null;
        this.metamaskListenerAdded = false;
        this.wcPollingInterval = null;
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
        this.tierRadios = document.getElementsByName('tierSelect');
        this.tierMoreAmount = document.getElementById('tierMoreAmount');
        this.tierRelayerAddress = document.getElementById('tierRelayerAddress');
        this.setTierButton = document.getElementById('setTierButton');
        this.tier1Info = document.getElementById('tier1Info');
        this.tier2Info = document.getElementById('tier2Info');
        this.currentTierStatus = document.getElementById('currentTierStatus');
        this.currentBond = document.getElementById('currentBond');
        this.currentVotingPower = document.getElementById('currentVotingPower');
        this.currentTier = document.getElementById('currentTier');

        // Withdraw section elements
        this.scheduleFullWithdrawButton = document.getElementById('scheduleFullWithdrawButton');
        this.executeFullWithdrawButton = document.getElementById('executeFullWithdrawButton');
        this.partialWithdrawAmount = document.getElementById('partialWithdrawAmount');
        this.schedulePartialWithdrawButton = document.getElementById('schedulePartialWithdrawButton');
        this.executePartialWithdrawButton = document.getElementById('executePartialWithdrawButton');
        this.accountRoleInfo = document.getElementById('accountRoleInfo');
        this.accountType = document.getElementById('accountType');
        this.pairStashAddress = document.getElementById('pairStashAddress');
        this.pairControllerAddress = document.getElementById('pairControllerAddress');
        this.pendingWithdrawStatus = document.getElementById('pendingWithdrawStatus');
        this.pendingWithdrawDetails = document.getElementById('pendingWithdrawDetails');
        this.cancelFullWithdrawButton = document.getElementById('cancelFullWithdrawButton');
        this.cancelPartialWithdrawButton = document.getElementById('cancelPartialWithdrawButton');

        // Store candidate info globally
        this.nominationCount = 0;
        this.stashAddress = null;
        this.controllerAddress = null;
        this.isStash = false;
        this.isController = false;

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

        if (window.ethereum) {
            window.ethereum.on('chainChanged', async () => {
                if (this.connectionType !== 'metamask') return;
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
        this.setTierButton.addEventListener('click', () => this.handleSetValidatorTier());

        // Tier radio button change event
        this.tierRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.handleTierChange(e.target.value));
        });

        // Withdraw section event listeners
        this.scheduleFullWithdrawButton.addEventListener('click', () => this.handleScheduleFullWithdraw());
        this.cancelFullWithdrawButton.addEventListener('click', () => this.handleCancelFullWithdraw());
        this.executeFullWithdrawButton.addEventListener('click', () => this.handleExecuteFullWithdraw());
        this.schedulePartialWithdrawButton.addEventListener('click', () => this.handleSchedulePartialWithdraw());
        this.cancelPartialWithdrawButton.addEventListener('click', () => this.handleCancelPartialWithdraw());
        this.executePartialWithdrawButton.addEventListener('click', () => this.handleExecutePartialWithdraw());
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
        } else {
            console.log("MetaMask is not installed");
            this.metamaskStatus.innerHTML = 'MetaMask is not installed. Use WalletConnect instead.';
            this.metamaskStatus.classList.add('not-installed');
            // MetaMask 버튼 비활성화
            if (this.connectButton) {
                this.connectButton.disabled = true;
                this.connectButton.title = 'MetaMask not installed';
            }
        }
        // WalletConnect는 항상 사용 가능하므로 섹션 표시
        this.walletSection.classList.remove('hidden');
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
            this.connectionType = 'metamask';

            await this.updateCurrentNetwork();

            // MetaMask 리스너는 한 번만 등록
            if (!this.metamaskListenerAdded) {
                this.metamaskListenerAdded = true;
                window.ethereum.on('accountsChanged', async (accounts) => {
                    if (this.connectionType !== 'metamask') return;
                    if (accounts.length === 0) {
                        this.disconnectWallet();
                    } else {
                        this.account = accounts[0];
                        this.accountAddress.textContent = this.account;
                        await this.updateCurrentNetwork();
                    }
                });
            }

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
            this.connectionType = 'walletconnect';

            await this.updateCurrentNetwork();

            // WalletConnect 체인/계정 변경 감지 (폴링)
            this.startWalletConnectPolling();

        } catch (error) {
            console.error('WalletConnect 연결 실패:', error);
            alert('WalletConnect 연결에 실패했습니다.');
        }
    }

    startWalletConnectPolling() {
        // 이전 폴링 중지
        if (this.wcPollingInterval) {
            clearInterval(this.wcPollingInterval);
        }

        let lastAddress = this.account;
        let lastChainId = modal.getChainId();

        this.wcPollingInterval = setInterval(async () => {
            if (this.connectionType !== 'walletconnect') {
                clearInterval(this.wcPollingInterval);
                return;
            }

            const currentAddress = modal.getAddress();
            const currentChainId = modal.getChainId();

            // 연결 해제 감지
            if (!currentAddress && lastAddress) {
                clearInterval(this.wcPollingInterval);
                this.disconnectWallet();
                return;
            }

            // 계정 변경 감지
            if (currentAddress && currentAddress.toLowerCase() !== lastAddress?.toLowerCase()) {
                lastAddress = currentAddress;
                this.account = currentAddress;
                this.provider = new ethers.BrowserProvider(modal.getWalletProvider());
                this.accountAddress.textContent = this.account;
                await this.initContract();
                await this.updateCurrentNetwork();
                return;
            }

            // 체인 변경 감지
            if (currentChainId && currentChainId !== lastChainId) {
                lastChainId = currentChainId;
                this.provider = new ethers.BrowserProvider(modal.getWalletProvider());
                await this.initContract();
                await this.updateCurrentNetwork();
            }
        }, 1000); // 1초마다 체크
    }

    async disconnectWallet() {
        const wasWalletConnect = this.connectionType === 'walletconnect';

        // WalletConnect 폴링 중지
        if (this.wcPollingInterval) {
            clearInterval(this.wcPollingInterval);
            this.wcPollingInterval = null;
        }

        this.account = null;
        this.connectionType = null;
        this.provider = null;
        this.accountAddress.textContent = '';
        this.walletInfo.classList.add('hidden');
        this.connectButton.classList.remove('hidden');

        // Reset form fields
        this.bondingAmount.value = '';
        this.relayer.value = '';
        this.controller.value = '';
        this.additionalAmount.value = '';
        this.tierMoreAmount.value = '';
        this.tierRelayerAddress.value = '';

        // Reset validation status
        this.validationStatus.textContent = '';
        this.validationStatus.style.display = 'none';

        // Reset tier radio to default (Tier 1)
        this.tierRadios[0].checked = true;

        // Disable all transaction buttons
        this.bondingButton.disabled = true;
        this.bondingAmount.disabled = true;
        this.relayer.disabled = true;
        this.controller.disabled = true;
        this.additionalAmount.disabled = true;
        this.bondMoreButton.disabled = true;
        this.tierMoreAmount.disabled = true;
        this.tierRelayerAddress.disabled = true;
        this.setTierButton.disabled = true;

        // Reset withdraw section
        this.partialWithdrawAmount.value = '';
        this.partialWithdrawAmount.disabled = true;
        this.scheduleFullWithdrawButton.disabled = true;
        this.cancelFullWithdrawButton.disabled = true;
        this.executeFullWithdrawButton.disabled = true;
        this.schedulePartialWithdrawButton.disabled = true;
        this.cancelPartialWithdrawButton.disabled = true;
        this.executePartialWithdrawButton.disabled = true;
        this.nominationCount = 0;
        this.stashAddress = null;
        this.controllerAddress = null;
        this.isStash = false;
        this.isController = false;
        this.accountRoleInfo.style.display = 'none';
        this.pendingWithdrawStatus.style.display = 'none';

        if (wasWalletConnect) {
            await modal.disconnect();
        }

        this.addLog('Wallet disconnected');
    }

    getExplorerUrl(hash) {
        let chainId;

        if (this.connectionType === 'walletconnect') {
            chainId = modal.getChainId();
        } else if (this.connectionType === 'metamask' && window.ethereum) {
            chainId = window.ethereum.chainId;
        } else {
            return null;
        }

        let baseUrl;

        if (chainId === '0xbfc' || chainId === 3068) {
            baseUrl = 'https://explorer.mainnet.bifrostnetwork.com/tx/';
        } else if (chainId === '0xbfc0' || chainId === 49088) {
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
            const stashes = states[1].map(addr => addr.toLowerCase());
            const index = stashes.indexOf(this.account.toLowerCase());

            if (index !== -1) {
                const formattedAmount = ethers.formatEther(states[2][index]);
                this.validationStatus.textContent = `[Stake amount: ${formattedAmount} BFC]`;
                this.validationStatus.classList.remove('invalid');
                this.validationStatus.classList.add('valid');
            }

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
            const stashes = states[1].map(addr => addr.toLowerCase());
            const index = stashes.indexOf(this.account.toLowerCase());

            if (index !== -1) {
                const formattedAmount = ethers.formatEther(states[2][index]);
                this.validationStatus.textContent = `[Stake amount: ${formattedAmount} BFC]`;
                this.validationStatus.classList.remove('invalid');
                this.validationStatus.classList.add('valid');
            }

        } catch (error) {
            console.error('Bond more transaction failed:', error);
            this.addLog('Bond more transaction failed: ' + error.message, true);
        }
    }

    async updateTierInfo() {
        try {
            if (!contract) {
                return;
            }

            // Get minimum self bond for each tier
            // Note: index 0 = Full (Tier 2), index 1 = Basic (Tier 1)
            const minSelfBond = await contract.candidate_minimum_self_bond();
            const tier1MinBond = ethers.formatEther(minSelfBond[1]); // Basic
            const tier2MinBond = ethers.formatEther(minSelfBond[0]); // Full

            // Get minimum voting power for each tier
            // Note: index 0 = Full (Tier 2), index 1 = Basic (Tier 1)
            const minVotingPower = await contract.candidate_minimum_voting_power();
            const tier1MinVP = ethers.formatEther(minVotingPower[1]); // Basic
            const tier2MinVP = ethers.formatEther(minVotingPower[0]); // Full

            // Update tier info display in one line
            this.tier1Info.textContent = `Min Bond: ${tier1MinBond} BFC | Min Voting Power: ${tier1MinVP} BFC`;
            this.tier2Info.textContent = `Min Bond: ${tier2MinBond} BFC | Min Voting Power: ${tier2MinVP} BFC`;

        } catch (error) {
            console.error('Failed to fetch tier info:', error);
            this.tier1Info.textContent = '';
            this.tier2Info.textContent = '';
        }
    }

    handleTierChange(tier) {
        if (tier === '1') {
            // Tier 1 (Basic): Disable more and relayer fields
            this.tierMoreAmount.disabled = true;
            this.tierRelayerAddress.disabled = true;
            this.tierMoreAmount.value = '';
            this.tierRelayerAddress.value = '';
        } else if (tier === '2') {
            // Tier 2 (Full): Enable more and relayer fields
            this.tierMoreAmount.disabled = false;
            this.tierRelayerAddress.disabled = false;
        }
    }

    async handleSetValidatorTier() {
        try {
            const selectedTier = document.querySelector('input[name="tierSelect"]:checked').value;
            let more = 0;
            let relayer = ethers.ZeroAddress;

            if (selectedTier === '2') {
                const moreAmount = this.tierMoreAmount.value;
                const relayerAddress = this.tierRelayerAddress.value;

                if (!moreAmount) {
                    alert('Please enter more amount for Tier 2.');
                    return;
                }

                if (!relayerAddress || !ethers.isAddress(relayerAddress)) {
                    alert('Please enter a valid relayer address for Tier 2.');
                    return;
                }

                more = ethers.parseEther(moreAmount.toString());
                relayer = relayerAddress;
            }

            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            const tx = await contract.set_validator_tier(
                more,
                parseInt(selectedTier),
                relayer
            );

            this.addLog('Set validator tier transaction sent:', false, tx.hash, '\nPlease wait for confirmation...');

            this.setTierButton.disabled = true;

            await tx.wait();
            this.addLog('Set validator tier transaction confirmed!');

            this.setTierButton.disabled = false;

        } catch (error) {
            console.error('Set validator tier transaction failed:', error);
            this.addLog('Set validator tier transaction failed: ' + error.message, true);
            this.setTierButton.disabled = false;
        }
    }

    async checkPendingWithdrawals(states, index) {
        try {
            let hasPartialRequest = false;
            let hasFullRequest = false;
            let detailsHtml = '';

            // Get current round info
            const roundInfo = await contract.round_info();
            const currentRound = Number(roundInfo.current_round_index);

            // Check for partial withdrawal request using candidate_request (requires controller address)
            const partialRequest = await contract.candidate_request(this.controllerAddress);
            const partialAmount = Number(partialRequest.amount);
            const partialWhenExecutable = Number(partialRequest.when_executable);

            if (partialAmount > 0 && partialWhenExecutable > 0) {
                hasPartialRequest = true;
                const formattedAmount = ethers.formatEther(partialRequest.amount);
                const roundsRemaining = partialWhenExecutable - currentRound;
                const timeInfo = this.calculateTimeRemaining(roundsRemaining);

                detailsHtml += `<div style="margin-bottom: 8px;">
                    <strong style="color: var(--text-primary);">Partial Withdrawal:</strong><br>
                    Amount: <span style="color: var(--primary-color);">${formattedAmount} BFC</span><br>
                    Executable at Round: ${partialWhenExecutable} (Current: ${currentRound})<br>
                    ${roundsRemaining > 0 ?
                        `<span style="color: var(--error-color);">${timeInfo}</span>` :
                        `<span style="color: var(--success-color);">Ready to execute!</span>`}
                </div>`;
            }

            // Check for full withdrawal request using is_selected from states
            // states[12] is is_selected (stored as round index when > 2)
            const isSelectedValue = Number(states[12][index]);

            if (isSelectedValue > 2) {
                hasFullRequest = true;
                const bondAmount = ethers.formatEther(states[2][index]);
                const roundsRemaining = isSelectedValue - currentRound;
                const timeInfo = this.calculateTimeRemaining(roundsRemaining);

                detailsHtml += `<div>
                    <strong style="color: var(--text-primary);">Full Withdrawal (Leave Candidates):</strong><br>
                    Amount: <span style="color: var(--error-color);">${bondAmount} BFC</span><br>
                    Executable at Round: ${isSelectedValue} (Current: ${currentRound})<br>
                    ${roundsRemaining > 0 ?
                        `<span style="color: var(--error-color);">${timeInfo}</span>` :
                        `<span style="color: var(--success-color);">Ready to execute!</span>`}
                </div>`;
            }

            if (hasPartialRequest || hasFullRequest) {
                this.pendingWithdrawDetails.innerHTML = detailsHtml;
                this.pendingWithdrawStatus.style.display = 'block';
            } else {
                this.pendingWithdrawStatus.style.display = 'none';
            }

            // Enable/disable cancel buttons based on pending requests
            this.cancelFullWithdrawButton.disabled = !hasFullRequest;
            this.cancelPartialWithdrawButton.disabled = !hasPartialRequest;

        } catch (error) {
            console.error('Failed to check pending withdrawals:', error);
            this.pendingWithdrawStatus.style.display = 'none';
            this.cancelFullWithdrawButton.disabled = true;
            this.cancelPartialWithdrawButton.disabled = true;
        }
    }

    calculateTimeRemaining(roundsRemaining) {
        if (roundsRemaining <= 0) {
            return 'Ready to execute';
        }

        // 1 round = 720 minutes = 12 hours
        const totalMinutes = roundsRemaining * 720;
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = totalMinutes % 60;

        let timeStr = '';
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0) timeStr += `${hours}h `;
        if (minutes > 0 && days === 0) timeStr += `${minutes}m`;

        return `~${timeStr.trim()} remaining (${roundsRemaining} rounds)`;
    }

    async handleScheduleFullWithdraw() {
        try {
            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            const tx = await contract.schedule_leave_candidates(100);

            this.addLog('Schedule full withdraw transaction sent:', false, tx.hash);

            this.scheduleFullWithdrawButton.disabled = true;

            await tx.wait();
            this.addLog('Schedule full withdraw confirmed! Execute after ~7 days.');

            this.scheduleFullWithdrawButton.disabled = false;
            await this.updateCurrentNetwork();

        } catch (error) {
            console.error('Schedule full withdraw failed:', error);
            this.addLog('Schedule full withdraw failed: ' + error.message, true);
            this.scheduleFullWithdrawButton.disabled = false;
        }
    }

    async handleCancelFullWithdraw() {
        try {
            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            const tx = await contract.cancel_leave_candidates(100);

            this.addLog('Cancel full withdraw transaction sent:', false, tx.hash);

            this.cancelFullWithdrawButton.disabled = true;

            await tx.wait();
            this.addLog('Cancel full withdraw confirmed!');

            this.cancelFullWithdrawButton.disabled = false;
            await this.updateCurrentNetwork();

        } catch (error) {
            console.error('Cancel full withdraw failed:', error);
            this.addLog('Cancel full withdraw failed: ' + error.message, true);
            this.cancelFullWithdrawButton.disabled = false;
        }
    }

    async handleExecuteFullWithdraw() {
        try {
            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            // Get fresh nomination count from candidate_states
            const states = await contract.candidate_states(0);
            const stashes = states[1].map(addr => addr.toLowerCase());
            const index = stashes.indexOf(this.account.toLowerCase());

            if (index === -1) {
                alert('You are not a candidate. Execute must be called from Stash account.');
                return;
            }

            // states[4] is nomination_count
            const nominationCount = Number(states[4][index]);

            const tx = await contract.execute_leave_candidates(nominationCount);

            this.addLog('Execute full withdraw transaction sent:', false, tx.hash);

            this.executeFullWithdrawButton.disabled = true;

            await tx.wait();
            this.addLog('Execute full withdraw confirmed! Funds withdrawn.');

            await this.updateCurrentNetwork();

        } catch (error) {
            console.error('Execute full withdraw failed:', error);
            this.addLog('Execute full withdraw failed: ' + error.message, true);
            this.executeFullWithdrawButton.disabled = false;
        }
    }

    async handleSchedulePartialWithdraw() {
        try {
            const amount = this.partialWithdrawAmount.value;

            if (!amount || parseFloat(amount) <= 0) {
                alert('Please enter a valid amount.');
                return;
            }

            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            const amountInWei = ethers.parseEther(amount.toString());

            const tx = await contract.schedule_candidate_bond_less(amountInWei);

            this.addLog('Schedule partial withdraw transaction sent:', false, tx.hash);

            this.schedulePartialWithdrawButton.disabled = true;

            await tx.wait();
            this.addLog(`Schedule partial withdraw of ${amount} BFC confirmed! Execute after ~7 days.`);

            this.schedulePartialWithdrawButton.disabled = false;
            await this.updateCurrentNetwork();

        } catch (error) {
            console.error('Schedule partial withdraw failed:', error);
            this.addLog('Schedule partial withdraw failed: ' + error.message, true);
            this.schedulePartialWithdrawButton.disabled = false;
        }
    }

    async handleCancelPartialWithdraw() {
        try {
            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            const tx = await contract.cancel_candidate_bond_less();

            this.addLog('Cancel partial withdraw transaction sent:', false, tx.hash);

            this.cancelPartialWithdrawButton.disabled = true;

            await tx.wait();
            this.addLog('Cancel partial withdraw confirmed!');

            this.cancelPartialWithdrawButton.disabled = false;
            await this.updateCurrentNetwork();

        } catch (error) {
            console.error('Cancel partial withdraw failed:', error);
            this.addLog('Cancel partial withdraw failed: ' + error.message, true);
            this.cancelPartialWithdrawButton.disabled = false;
        }
    }

    async handleExecutePartialWithdraw() {
        try {
            if (!contract || contract.runner.address.toLowerCase() !== this.account.toLowerCase()) {
                await this.initContract();
            }

            const tx = await contract.execute_candidate_bond_less();

            this.addLog('Execute partial withdraw transaction sent:', false, tx.hash);

            this.executePartialWithdrawButton.disabled = true;

            await tx.wait();
            this.addLog('Execute partial withdraw confirmed! Funds withdrawn.');

            await this.updateCurrentNetwork();

        } catch (error) {
            console.error('Execute partial withdraw failed:', error);
            this.addLog('Execute partial withdraw failed: ' + error.message, true);
            this.executePartialWithdrawButton.disabled = false;
        }
    }

    async addNetwork() {
        if (this.connectionType === 'walletconnect') {
            alert('WalletConnect 사용 시 지갑 앱에서 직접 네트워크를 추가해주세요.');
            return;
        }
        if (!window.ethereum) {
            alert('MetaMask가 설치되어 있지 않습니다.');
            return;
        }
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
        if (this.connectionType === 'walletconnect') {
            alert('WalletConnect 사용 시 지갑 앱에서 직접 네트워크를 변경해주세요.');
            return;
        }
        if (!window.ethereum) {
            alert('MetaMask가 설치되어 있지 않습니다.');
            return;
        }
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
        if (this.connectionType === 'walletconnect') {
            alert('WalletConnect 사용 시 지갑 앱에서 직접 네트워크를 추가해주세요.');
            return;
        }
        if (!window.ethereum) {
            alert('MetaMask가 설치되어 있지 않습니다.');
            return;
        }
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
        if (this.connectionType === 'walletconnect') {
            alert('WalletConnect 사용 시 지갑 앱에서 직접 네트워크를 변경해주세요.');
            return;
        }
        if (!window.ethereum) {
            alert('MetaMask가 설치되어 있지 않습니다.');
            return;
        }
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
        if (!this.provider || !this.connectionType) {
            this.networkName.textContent = 'Not connected';
            return;
        }

        try {
            let chainId;

            if (this.connectionType === 'walletconnect') {
                chainId = modal.getChainId();
            } else if (this.connectionType === 'metamask') {
                chainId = await window.ethereum.request({ method: 'eth_chainId' });
            } else {
                return;
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
                this.tierMoreAmount.value = '';
                this.tierRelayerAddress.value = '';
                this.bondingButton.disabled = !this.bondingAmount.value;

                if ((chainId === '0xbfc0' || chainId === '0xbfc' || chainId === 49088 || chainId === 3068) && this.account) {
                    await this.initContract();

                    // Update tier information
                    await this.updateTierInfo();

                    try {
                        // Get all candidates and check if connected address is a stash or controller
                        const states = await contract.candidate_states(0);
                        const controllers = states[0].map(addr => addr.toLowerCase());
                        const stashes = states[1].map(addr => addr.toLowerCase());

                        // Check if connected account is in stash or controller array
                        const stashIndex = stashes.indexOf(this.account.toLowerCase());
                        const controllerIndex = controllers.indexOf(this.account.toLowerCase());

                        let index = -1;
                        this.isStash = false;
                        this.isController = false;

                        if (stashIndex !== -1) {
                            index = stashIndex;
                            this.isStash = true;
                            this.stashAddress = this.account;
                            this.controllerAddress = states[0][index];
                        } else if (controllerIndex !== -1) {
                            index = controllerIndex;
                            this.isController = true;
                            this.controllerAddress = this.account;
                            this.stashAddress = states[1][index];
                        }

                        const isValid = index !== -1;

                        if (isValid) {
                            // Get candidate info using the index
                            const formattedAmount = ethers.formatEther(states[2][index]); // bond
                            const formattedVP = ethers.formatEther(states[5][index]); // voting_power

                            // Map tier number to text
                            let tierText = 'Unknown';
                            const tierValue = Number(states[19][index]); // tier
                            if (tierValue === 0) {
                                tierText = 'Non Candidate';
                            } else if (tierValue === 1) {
                                tierText = 'Basic';
                            } else if (tierValue === 2) {
                                tierText = 'Full';
                            }

                            this.validationStatus.textContent = `[Stake amount: ${formattedAmount} BFC]`;
                            this.validationStatus.classList.remove('invalid');
                            this.validationStatus.classList.add('valid');

                            // Update current tier status
                            this.currentBond.textContent = formattedAmount;
                            this.currentVotingPower.textContent = formattedVP;
                            this.currentTier.textContent = tierText;
                            this.currentTierStatus.style.display = 'block';

                            // Update account role info
                            this.accountType.textContent = this.isStash ? 'Stash' : 'Controller';
                            this.accountType.style.color = this.isStash ? 'var(--success-color)' : 'var(--primary-color)';
                            this.pairStashAddress.textContent = this.stashAddress ?
                                `${this.stashAddress.slice(0, 6)}...${this.stashAddress.slice(-4)}` : '-';
                            this.pairControllerAddress.textContent = this.controllerAddress ?
                                `${this.controllerAddress.slice(0, 6)}...${this.controllerAddress.slice(-4)}` : '-';
                            this.accountRoleInfo.style.display = 'block';

                            // Check for pending withdrawal requests
                            await this.checkPendingWithdrawals(states, index);

                        } else {
                            this.validationStatus.textContent = '[Not a Candidate]';
                            this.validationStatus.classList.remove('valid');
                            this.validationStatus.classList.add('invalid');

                            // Hide current tier status and account role info
                            this.currentTierStatus.style.display = 'none';
                            this.accountRoleInfo.style.display = 'none';
                            this.pendingWithdrawStatus.style.display = 'none';
                        }
                        this.validationStatus.style.display = 'inline';

                        // Always enable bonding section (can be used for both bond and bond more)
                        this.bondingButton.disabled = false;
                        this.bondingAmount.disabled = false;
                        this.relayer.disabled = false;
                        this.controller.disabled = false;

                        if (isValid) {
                            // Enable additional features for registered candidates
                            this.additionalAmount.disabled = false;
                            this.bondMoreButton.disabled = false;
                            this.setTierButton.disabled = false;
                            // Initialize tier fields based on current tier selection
                            const selectedTier = document.querySelector('input[name="tierSelect"]:checked').value;
                            this.handleTierChange(selectedTier);

                            // Enable withdraw section for candidates
                            // Cancel buttons are enabled by checkPendingWithdrawals based on pending requests
                            this.scheduleFullWithdrawButton.disabled = false;
                            this.executeFullWithdrawButton.disabled = false;
                            this.partialWithdrawAmount.disabled = false;
                            this.schedulePartialWithdrawButton.disabled = false;
                            this.executePartialWithdrawButton.disabled = false;

                            // Store nomination count for later use (states[4] is nomination_count)
                            this.nominationCount = Number(states[4][index]);
                        } else {
                            // Disable additional features for non-candidates
                            this.additionalAmount.disabled = true;
                            this.bondMoreButton.disabled = true;
                            this.tierMoreAmount.disabled = true;
                            this.tierRelayerAddress.disabled = true;
                            this.setTierButton.disabled = true;

                            // Disable withdraw section for non-candidates
                            this.scheduleFullWithdrawButton.disabled = true;
                            this.cancelFullWithdrawButton.disabled = true;
                            this.executeFullWithdrawButton.disabled = true;
                            this.partialWithdrawAmount.disabled = true;
                            this.schedulePartialWithdrawButton.disabled = true;
                            this.cancelPartialWithdrawButton.disabled = true;
                            this.executePartialWithdrawButton.disabled = true;
                            this.nominationCount = 0;
                            this.stashAddress = null;
                            this.controllerAddress = null;
                        }


                    } catch (error) {
                        console.error('Failed to check candidate state:', error);
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
    }
}

new WalletConnector(); 