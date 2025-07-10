const CONTRACT_ADDRESS = "0xA15ED92d12d602e0f2024C7AFe3692F17bCe6FA2";

const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function currentPeriod() view returns (uint256)",
    "function startNewPeriod() external",
    "function submitTravelData(uint32 _carbonSaved) external",
    "function endPeriod() external",
    "function processNextParticipant() external",
    "function claimRewards() external",
    "function getCurrentPeriodInfo() external view returns (uint256 period, bool active, bool ended, uint256 startTime, uint256 endTime, uint256 participantCount, uint256 timeRemaining)",
    "function getParticipantStatus(address participant) external view returns (bool hasSubmitted, uint256 submissionTime, bool processed, uint32 reward)",
    "function getLifetimeStats(address participant) external view returns (uint256 totalRewards, uint256 totalCarbonSaved)",
    "function canEndPeriod() external view returns (bool)",
    "event PeriodStarted(uint256 indexed period, uint256 startTime)",
    "event TravelSubmitted(address indexed participant, uint256 indexed period)",
    "event RewardsCalculated(uint256 indexed period, address indexed participant, uint32 reward)",
    "event PeriodEnded(uint256 indexed period, uint32 totalRewards)",
    "event RewardsClaimed(address indexed participant, uint256 amount)"
];

let provider;
let signer;
let contract;
let userAddress;

async function init() {
    setupEventListeners();
    await checkWalletConnection();
}

function setupEventListeners() {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('submitTravel').addEventListener('click', submitTravelData);
    document.getElementById('claimRewards').addEventListener('click', claimRewards);

    const startPeriodBtn = document.getElementById('startPeriod');
    const endPeriodBtn = document.getElementById('endPeriod');
    const processNextBtn = document.getElementById('processNext');

    if (startPeriodBtn) startPeriodBtn.addEventListener('click', startNewPeriod);
    if (endPeriodBtn) endPeriodBtn.addEventListener('click', endCurrentPeriod);
    if (processNextBtn) processNextBtn.addEventListener('click', processNextParticipant);

    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
    }
}

async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
}

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this application!');
        return;
    }

    try {
        showLoading('Connecting wallet...');

        await window.ethereum.request({ method: 'eth_requestAccounts' });

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const network = await provider.getNetwork();

        document.getElementById('connectWallet').style.display = 'none';
        document.getElementById('walletInfo').style.display = 'flex';
        document.getElementById('walletAddress').textContent = formatAddress(userAddress);
        document.getElementById('networkName').textContent = network.name;

        await checkAdminStatus();
        await loadPeriodInfo();
        await loadUserStats();

        setupContractEventListeners();

        document.getElementById('submitTravel').disabled = false;
        document.getElementById('claimRewards').disabled = false;

        hideLoading();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        hideLoading();
        showStatus('Failed to connect wallet', 'error');
    }
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        location.reload();
    } else {
        await connectWallet();
    }
}

async function checkAdminStatus() {
    try {
        const owner = await contract.owner();
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
            document.getElementById('adminSection').style.display = 'block';
            document.getElementById('adminHint').textContent = 'You are the admin! Click "Start New Period" below.';
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

async function loadPeriodInfo() {
    try {
        const info = await contract.getCurrentPeriodInfo();

        document.getElementById('currentPeriod').textContent = info.period.toString();

        let status = 'Unknown';
        let submitEnabled = false;

        if (info.active && !info.ended) {
            status = '✅ Active';
            submitEnabled = true;
            document.getElementById('noPeriodWarning').style.display = 'none';
        } else if (info.ended) {
            status = '🔒 Ended';
            document.getElementById('noPeriodWarning').style.display = 'block';
        } else {
            status = '⏸️ Not Started';
            document.getElementById('noPeriodWarning').style.display = 'block';
        }
        document.getElementById('periodStatus').textContent = status;

        document.getElementById('participantCount').textContent = info.participantCount.toString();

        if (info.timeRemaining.gt(0)) {
            const days = Math.floor(info.timeRemaining / 86400);
            const hours = Math.floor((info.timeRemaining % 86400) / 3600);
            const minutes = Math.floor((info.timeRemaining % 3600) / 60);
            document.getElementById('timeRemaining').textContent = `${days}d ${hours}h ${minutes}m`;
        } else {
            document.getElementById('timeRemaining').textContent = 'Expired';
        }

        if (userAddress) {
            const participantStatus = await contract.getParticipantStatus(userAddress);

            if (!info.active || info.ended) {
                document.getElementById('submitTravel').disabled = true;
                document.getElementById('submitTravel').textContent = '⏸️ Period Not Active';
            } else if (participantStatus.hasSubmitted) {
                document.getElementById('submitTravel').disabled = true;
                document.getElementById('submitTravel').textContent = '✓ Already Submitted';
            } else {
                document.getElementById('submitTravel').disabled = false;
                document.getElementById('submitTravel').textContent = 'Submit Travel Data';
            }
        }

    } catch (error) {
        console.error('Error loading period info:', error);
    }
}

async function loadUserStats() {
    if (!userAddress) return;

    try {
        const stats = await contract.getLifetimeStats(userAddress);

        document.getElementById('totalRewards').textContent = stats.totalRewards.toString();
        document.getElementById('lifetimeCarbon').textContent = formatNumber(stats.totalCarbonSaved.toString());

        const participantStatus = await contract.getParticipantStatus(userAddress);
        document.getElementById('currentReward').textContent = participantStatus.reward.toString();

    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

async function submitTravelData() {
    const carbonAmount = document.getElementById('carbonAmount').value;

    if (!carbonAmount || carbonAmount <= 0) {
        showStatus('⚠️ Please enter a valid carbon amount', 'error');
        return;
    }

    if (carbonAmount < 1000) {
        showStatus('⚠️ Minimum carbon savings is 1,000 grams to qualify for rewards', 'error');
        return;
    }

    try {
        // Check period status first
        const info = await contract.getCurrentPeriodInfo();
        if (!info.active || info.ended) {
            showStatus('⏸️ No active period. Please ask admin to start a new period first.', 'error');
            return;
        }

        showLoading('Submitting travel data...');

        const tx = await contract.submitTravelData(parseInt(carbonAmount));

        showLoading('Waiting for confirmation...');
        await tx.wait();

        hideLoading();
        showStatus('✅ Travel data submitted successfully! 🎉', 'success');

        document.getElementById('carbonAmount').value = '';
        document.getElementById('submitTravel').disabled = true;
        document.getElementById('submitTravel').textContent = '✓ Already Submitted';

        await loadPeriodInfo();

    } catch (error) {
        console.error('Error submitting travel data:', error);
        hideLoading();

        if (error.code === 4001) {
            showStatus('❌ Transaction cancelled by user', 'error');
        } else if (error.message.includes('Already submitted')) {
            showStatus('⚠️ You have already submitted data for this period', 'error');
        } else if (error.message.includes('No active period')) {
            showStatus('⏸️ No active period. Please ask admin to start a new period first.', 'error');
        } else {
            showStatus('❌ Failed to submit: ' + error.reason || error.message, 'error');
        }
    }
}

async function claimRewards() {
    try {
        // Check if user has rewards first
        const stats = await contract.getLifetimeStats(userAddress);
        if (stats.totalRewards.eq(0)) {
            showStatus('ℹ️ You have no rewards to claim yet. Submit travel data first!', 'info');
            return;
        }

        showLoading('Claiming rewards...');

        const tx = await contract.claimRewards();

        showLoading('Waiting for confirmation...');
        await tx.wait();

        hideLoading();
        showStatus('✅ Rewards claimed successfully! 🎉', 'success');

        await loadUserStats();

    } catch (error) {
        console.error('Error claiming rewards:', error);
        hideLoading();

        if (error.code === 4001) {
            showStatus('❌ Transaction cancelled by user', 'error');
        } else if (error.message.includes('No rewards')) {
            showStatus('ℹ️ You have no rewards to claim. Submit travel data first!', 'info');
        } else {
            showStatus('❌ Failed to claim rewards: ' + (error.reason || error.message), 'error');
        }
    }
}

async function startNewPeriod() {
    try {
        showLoading('Starting new period...');

        const tx = await contract.startNewPeriod();

        showLoading('Waiting for confirmation...');
        await tx.wait();

        hideLoading();
        showStatus('New period started successfully! 🎉', 'success');

        await loadPeriodInfo();

    } catch (error) {
        console.error('Error starting period:', error);
        hideLoading();

        if (error.code === 4001) {
            showStatus('Transaction cancelled by user', 'error');
        } else {
            showStatus('Failed to start period: ' + error.message, 'error');
        }
    }
}

async function endCurrentPeriod() {
    try {
        showLoading('Ending current period...');

        const tx = await contract.endPeriod();

        showLoading('Waiting for confirmation...');
        await tx.wait();

        hideLoading();
        showStatus('Period ended successfully! Processing rewards...', 'success');

        await loadPeriodInfo();

    } catch (error) {
        console.error('Error ending period:', error);
        hideLoading();

        if (error.code === 4001) {
            showStatus('Transaction cancelled by user', 'error');
        } else {
            showStatus('Failed to end period: ' + error.message, 'error');
        }
    }
}

async function processNextParticipant() {
    try {
        showLoading('Processing next participant...');

        const tx = await contract.processNextParticipant();

        showLoading('Waiting for confirmation...');
        await tx.wait();

        hideLoading();
        showStatus('Next participant processed successfully!', 'success');

        await loadPeriodInfo();

    } catch (error) {
        console.error('Error processing participant:', error);
        hideLoading();

        if (error.code === 4001) {
            showStatus('Transaction cancelled by user', 'error');
        } else {
            showStatus('Failed to process participant: ' + error.message, 'error');
        }
    }
}

function setupContractEventListeners() {
    contract.on('PeriodStarted', (period, startTime) => {
        console.log('Period started:', period.toString());
        loadPeriodInfo();
    });

    contract.on('TravelSubmitted', (participant, period) => {
        console.log('Travel submitted:', participant);
        if (participant.toLowerCase() === userAddress.toLowerCase()) {
            loadUserStats();
        }
        loadPeriodInfo();
    });

    contract.on('RewardsCalculated', (period, participant, reward) => {
        console.log('Rewards calculated:', participant, reward.toString());
        if (participant.toLowerCase() === userAddress.toLowerCase()) {
            loadUserStats();
        }
    });

    contract.on('PeriodEnded', (period, totalRewards) => {
        console.log('Period ended:', period.toString());
        loadPeriodInfo();
        loadUserStats();
    });

    contract.on('RewardsClaimed', (participant, amount) => {
        console.log('Rewards claimed:', participant, amount.toString());
        if (participant.toLowerCase() === userAddress.toLowerCase()) {
            loadUserStats();
        }
    });
}

function formatAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatNumber(num) {
    return parseInt(num).toLocaleString();
}

function showLoading(message) {
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.querySelector('.loading-text').textContent = message;
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('submissionStatus');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';

    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

window.addEventListener('load', init);