// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IGatewayCallback.sol";

/**
 * @title PrivacyGateway
 * @notice Gateway contract for handling encrypted requests and decryption with refund mechanisms
 * @dev Implements Gateway callback pattern with timeout protection and refund mechanisms
 */
contract PrivacyGateway is Ownable, ReentrancyGuard, Pausable {
    // ============ Events ============
    event RequestCreated(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 amount,
        uint256 timestamp
    );

    event DecryptionCompleted(
        bytes32 indexed requestId,
        address indexed gateway,
        bytes encryptedData,
        bool success
    );

    event DecryptionFailed(
        bytes32 indexed requestId,
        address indexed gateway,
        string reason
    );

    event RefundProcessed(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 amount
    );

    event TimeoutActivated(
        bytes32 indexed requestId,
        address indexed requester
    );

    event GatewayApproved(address indexed gateway);
    event GatewayRevoked(address indexed gateway);

    // ============ Structs ============
    struct DecryptionRequest {
        address requester;
        uint256 amount;
        bytes encryptedData;
        RequestStatus status;
        uint256 createdAt;
        uint256 timeoutDuration;
        address callback;
    }

    enum RequestStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        REFUNDED
    }

    // ============ State Variables ============
    mapping(bytes32 => DecryptionRequest) public requests;
    mapping(address => bool) public approvedGateways;
    mapping(address => uint256) public gatewayBalance;

    uint256 public defaultTimeoutDuration = 24 hours;
    uint256 public minTimeout = 1 hours;
    uint256 public maxTimeout = 30 days;

    address[] public gatewayList;

    // ============ Modifiers ============
    modifier onlyGateway() {
        require(approvedGateways[msg.sender], "Only approved gateway can call");
        _;
    }

    modifier requestExists(bytes32 requestId) {
        require(requests[requestId].requester != address(0), "Request does not exist");
        _;
    }

    modifier onlyRequester(bytes32 requestId) {
        require(msg.sender == requests[requestId].requester, "Only requester can call");
        _;
    }

    // ============ Constructor ============
    constructor() {
        defaultTimeoutDuration = 24 hours;
    }

    // ============ Core Functions ============
    /**
     * @notice Submit encrypted decryption request
     * @param encryptedData The encrypted data requiring decryption
     * @param callbackAddress Address of the callback contract
     * @param timeoutDuration Custom timeout duration (0 for default)
     * @return requestId The unique request identifier
     */
    function submitDecryptionRequest(
        bytes calldata encryptedData,
        address callbackAddress,
        uint256 timeoutDuration
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(msg.value > 0, "Must send ETH for request");
        require(callbackAddress != address(0), "Invalid callback address");
        require(encryptedData.length > 0, "Encrypted data cannot be empty");

        // Validate timeout
        uint256 timeout = timeoutDuration > 0 ? timeoutDuration : defaultTimeoutDuration;
        require(timeout >= minTimeout && timeout <= maxTimeout, "Invalid timeout duration");

        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, block.timestamp, encryptedData));

        require(requests[requestId].requester == address(0), "Request already exists");

        requests[requestId] = DecryptionRequest({
            requester: msg.sender,
            amount: msg.value,
            encryptedData: encryptedData,
            status: RequestStatus.PENDING,
            createdAt: block.timestamp,
            timeoutDuration: timeout,
            callback: callbackAddress
        });

        emit RequestCreated(requestId, msg.sender, msg.value, block.timestamp);

        return requestId;
    }

    /**
     * @notice Gateway completes decryption and triggers callback
     * @param requestId The request identifier
     * @param decryptedData The successfully decrypted data
     */
    function completeDecryption(
        bytes32 requestId,
        bytes calldata decryptedData
    ) external onlyGateway requestExists(requestId) nonReentrant {
        DecryptionRequest storage req = requests[requestId];

        require(req.status == RequestStatus.PENDING, "Request not pending");
        require(!isRequestTimedOut(requestId), "Request has timed out");

        req.status = RequestStatus.PROCESSING;

        // Execute callback
        try IGatewayCallback(req.callback).onDecryptionComplete(
            requestId,
            req.requester,
            req.encryptedData,
            decryptedData
        ) returns (bool success) {
            if (success) {
                req.status = RequestStatus.COMPLETED;
                gatewayBalance[msg.sender] += req.amount;

                emit DecryptionCompleted(requestId, msg.sender, decryptedData, true);
            } else {
                req.status = RequestStatus.FAILED;
                emit DecryptionFailed(requestId, msg.sender, "Callback returned false");
                _processRefund(requestId);
            }
        } catch Error(string memory reason) {
            req.status = RequestStatus.FAILED;
            emit DecryptionFailed(requestId, msg.sender, reason);
            _processRefund(requestId);
        } catch {
            req.status = RequestStatus.FAILED;
            emit DecryptionFailed(requestId, msg.sender, "Callback execution failed");
            _processRefund(requestId);
        }
    }

    /**
     * @notice Claim refund if request fails or times out
     * @param requestId The request identifier
     */
    function claimRefund(bytes32 requestId)
        external
        onlyRequester(requestId)
        requestExists(requestId)
        nonReentrant
    {
        DecryptionRequest storage req = requests[requestId];

        require(req.status != RequestStatus.COMPLETED, "Cannot refund completed request");
        require(req.status != RequestStatus.REFUNDED, "Already refunded");

        // Can refund if failed or timed out
        bool canRefund = req.status == RequestStatus.FAILED || isRequestTimedOut(requestId);
        require(canRefund, "Request not eligible for refund");

        req.status = RequestStatus.REFUNDED;
        uint256 refundAmount = req.amount;

        emit RefundProcessed(requestId, msg.sender, refundAmount);

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund transfer failed");
    }

    /**
     * @notice Force timeout on expired request
     * @param requestId The request identifier
     */
    function forceTimeout(bytes32 requestId)
        external
        requestExists(requestId)
        nonReentrant
    {
        DecryptionRequest storage req = requests[requestId];

        require(isRequestTimedOut(requestId), "Request has not timed out yet");
        require(req.status == RequestStatus.PENDING || req.status == RequestStatus.PROCESSING, "Invalid request status");

        req.status = RequestStatus.FAILED;

        emit TimeoutActivated(requestId, req.requester);
    }

    /**
     * @notice Check if request has timed out
     * @param requestId The request identifier
     * @return Whether the request has timed out
     */
    function isRequestTimedOut(bytes32 requestId) public view requestExists(requestId) returns (bool) {
        DecryptionRequest storage req = requests[requestId];
        return block.timestamp > req.createdAt + req.timeoutDuration;
    }

    // ============ Gateway Management ============
    /**
     * @notice Approve a new gateway
     * @param gateway Address of the gateway to approve
     */
    function approveGateway(address gateway) external onlyOwner {
        require(gateway != address(0), "Invalid gateway address");
        require(!approvedGateways[gateway], "Gateway already approved");

        approvedGateways[gateway] = true;
        gatewayList.push(gateway);

        emit GatewayApproved(gateway);
    }

    /**
     * @notice Revoke gateway approval
     * @param gateway Address of the gateway to revoke
     */
    function revokeGateway(address gateway) external onlyOwner {
        require(approvedGateways[gateway], "Gateway not approved");

        approvedGateways[gateway] = false;

        emit GatewayRevoked(gateway);
    }

    /**
     * @notice Withdraw accumulated fees
     * @param gateway Address of the gateway
     */
    function withdrawGatewayBalance(address gateway) external nonReentrant {
        require(msg.sender == gateway || msg.sender == owner(), "Not authorized");

        uint256 balance = gatewayBalance[gateway];
        require(balance > 0, "No balance to withdraw");

        gatewayBalance[gateway] = 0;

        (bool success, ) = gateway.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // ============ Configuration ============
    /**
     * @notice Update default timeout duration
     * @param newDuration New timeout duration in seconds
     */
    function setDefaultTimeout(uint256 newDuration) external onlyOwner {
        require(newDuration >= minTimeout && newDuration <= maxTimeout, "Invalid duration");
        defaultTimeoutDuration = newDuration;
    }

    /**
     * @notice Update timeout constraints
     * @param newMin Minimum timeout in seconds
     * @param newMax Maximum timeout in seconds
     */
    function setTimeoutConstraints(uint256 newMin, uint256 newMax) external onlyOwner {
        require(newMin > 0 && newMax > newMin, "Invalid constraints");
        minTimeout = newMin;
        maxTimeout = newMax;
    }

    // ============ Emergency Functions ============
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============
    function _processRefund(bytes32 requestId) internal {
        DecryptionRequest storage req = requests[requestId];
        req.status = RequestStatus.REFUNDED;

        emit RefundProcessed(requestId, req.requester, req.amount);

        (bool success, ) = req.requester.call{value: req.amount}("");
        require(success, "Automatic refund failed");
    }

    // ============ View Functions ============
    /**
     * @notice Get request details
     * @param requestId The request identifier
     * @return The request structure
     */
    function getRequest(bytes32 requestId)
        external
        view
        requestExists(requestId)
        returns (DecryptionRequest memory)
    {
        return requests[requestId];
    }

    /**
     * @notice Get request status
     * @param requestId The request identifier
     * @return The current status
     */
    function getRequestStatus(bytes32 requestId)
        external
        view
        requestExists(requestId)
        returns (RequestStatus)
    {
        return requests[requestId].status;
    }

    /**
     * @notice Get all approved gateways
     * @return Array of approved gateway addresses
     */
    function getApprovedGateways() external view returns (address[] memory) {
        return gatewayList;
    }

    /**
     * @notice Get gateway balance
     * @param gateway Address of the gateway
     * @return The accumulated balance
     */
    function getGatewayBalance(address gateway) external view returns (uint256) {
        return gatewayBalance[gateway];
    }
}
