// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IGatewayCallback.sol";
import "./PrivacyGateway.sol";
import "./PrivacyComputation.sol";

/**
 * @title ExamplePrivacyDApp
 * @notice Example DApp demonstrating privacy-preserving operations with Gateway pattern
 * @dev Shows how to use PrivacyGateway for encrypted transactions with refund protection
 */
contract ExamplePrivacyDApp is IGatewayCallback, Ownable, ReentrancyGuard {
    // ============ State Variables ============
    PrivacyGateway public gateway;
    PrivacyComputation public privacyComputation;

    mapping(bytes32 => OrderData) public orders;
    mapping(bytes32 => bool) public processedRequests;

    struct OrderData {
        address trader;
        uint256 encryptedAmount;
        uint256 encryptedPrice;
        uint256 timestamp;
        bool completed;
    }

    // ============ Events ============
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed trader,
        uint256 timestamp
    );

    event OrderProcessed(
        bytes32 indexed orderId,
        address indexed trader,
        uint256 actualAmount,
        uint256 actualPrice
    );

    event OrderFailed(
        bytes32 indexed orderId,
        address indexed trader,
        string reason
    );

    // ============ Constructor ============
    constructor(address _gateway, address _privacyComputation) {
        require(_gateway != address(0), "Invalid gateway address");
        require(_privacyComputation != address(0), "Invalid computation address");

        gateway = PrivacyGateway(_gateway);
        privacyComputation = PrivacyComputation(_privacyComputation);
    }

    // ============ Public Functions ============
    /**
     * @notice Create a privacy-preserving order
     * @param encryptedOrderData The encrypted order details
     * @return orderId The unique order identifier
     */
    function createPrivateOrder(
        bytes calldata encryptedOrderData
    ) external payable nonReentrant returns (bytes32) {
        require(msg.value > 0, "Must send funds");
        require(encryptedOrderData.length > 0, "Invalid encrypted data");

        // Submit to gateway for decryption with callback to this contract
        bytes32 requestId = gateway.submitDecryptionRequest(
            encryptedOrderData,
            address(this),
            0 // Use default timeout
        );

        // Store order data linked to request
        orders[requestId] = OrderData({
            trader: msg.sender,
            encryptedAmount: uint256(keccak256(encryptedOrderData[:32])),
            encryptedPrice: uint256(keccak256(encryptedOrderData[32:])),
            timestamp: block.timestamp,
            completed: false
        });

        emit OrderCreated(requestId, msg.sender, block.timestamp);

        return requestId;
    }

    /**
     * @notice Privacy-preserving division for price calculation
     * @param numerator The dividend
     * @param denominator The divisor
     * @param randomMultiplier Random multiplier for privacy
     * @return Protected division result
     */
    function calculatePrivatePrice(
        uint256 numerator,
        uint256 denominator,
        uint256 randomMultiplier
    ) external view returns (uint256) {
        return privacyComputation.privacyDivide(numerator, denominator, randomMultiplier);
    }

    /**
     * @notice Obfuscate price to prevent disclosure
     * @param price The actual price
     * @param blindingFactor The secret blinding factor
     * @return The obfuscated price
     */
    function hidePrice(
        uint256 price,
        uint256 blindingFactor
    ) external view returns (uint256) {
        return privacyComputation.obfuscatePrice(price, blindingFactor);
    }

    /**
     * @notice Reveal obfuscated price (only by authorized party)
     * @param obfuscatedPrice The obfuscated price
     * @param blindingFactor The correct blinding factor
     * @return The original price
     */
    function revealPrice(
        uint256 obfuscatedPrice,
        uint256 blindingFactor
    ) external view returns (uint256) {
        return privacyComputation.revealObfuscatedValue(obfuscatedPrice, blindingFactor);
    }

    // ============ Gateway Callback Implementation ============
    /**
     * @notice Callback from PrivacyGateway when decryption is complete
     * @dev This is called by the gateway after successful decryption
     * @param requestId The request identifier
     * @param requester The original requester
     * @param encryptedData The original encrypted data
     * @param decryptedData The decrypted data
     * @return success Whether processing was successful
     */
    function onDecryptionComplete(
        bytes32 requestId,
        address requester,
        bytes calldata encryptedData,
        bytes calldata decryptedData
    ) external override nonReentrant returns (bool) {
        require(msg.sender == address(gateway), "Only gateway can call");
        require(!processedRequests[requestId], "Request already processed");

        OrderData storage order = orders[requestId];
        require(order.trader != address(0), "Order not found");
        require(!order.completed, "Order already completed");

        try this._processDecryptedOrder(requestId, decryptedData) {
            order.completed = true;
            processedRequests[requestId] = true;

            // Extract decoded values (example - adjust based on your encoding)
            uint256 amount = _decodeAmount(decryptedData);
            uint256 price = _decodePrice(decryptedData);

            emit OrderProcessed(requestId, requester, amount, price);

            return true;
        } catch Error(string memory reason) {
            emit OrderFailed(requestId, requester, reason);
            return false;
        } catch {
            emit OrderFailed(requestId, requester, "Unknown error during processing");
            return false;
        }
    }

    // ============ Internal Functions ============
    /**
     * @notice Process the decrypted order data
     * @param requestId The request identifier
     * @param decryptedData The decrypted order data
     */
    function _processDecryptedOrder(
        bytes32 requestId,
        bytes calldata decryptedData
    ) external {
        require(msg.sender == address(this), "Only self can call");
        require(decryptedData.length >= 64, "Invalid decrypted data");

        // Validate and process the decrypted data
        uint256 amount = _decodeAmount(decryptedData);
        uint256 price = _decodePrice(decryptedData);

        require(amount > 0, "Invalid amount");
        require(price > 0, "Invalid price");

        // Perform actual order processing here
        // This is where the decrypted values would be used for trading logic
    }

    /**
     * @notice Decode amount from decrypted data
     * @param data The decrypted data
     * @return The decoded amount
     */
    function _decodeAmount(bytes calldata data) internal pure returns (uint256) {
        require(data.length >= 32, "Insufficient data for amount");
        return abi.decode(data[:32], (uint256));
    }

    /**
     * @notice Decode price from decrypted data
     * @param data The decrypted data
     * @return The decoded price
     */
    function _decodePrice(bytes calldata data) internal pure returns (uint256) {
        require(data.length >= 64, "Insufficient data for price");
        return abi.decode(data[32:64], (uint256));
    }

    // ============ Refund Functions ============
    /**
     * @notice Request refund if order failed or timed out
     * @param requestId The request identifier
     */
    function requestRefund(bytes32 requestId) external nonReentrant {
        OrderData storage order = orders[requestId];
        require(order.trader == msg.sender, "Not the trader");
        require(!order.completed, "Cannot refund completed order");

        // Call gateway to handle refund
        gateway.claimRefund(requestId);

        order.completed = true;
    }

    /**
     * @notice Force timeout on stuck orders
     * @param requestId The request identifier
     */
    function forceOrderTimeout(bytes32 requestId) external nonReentrant {
        gateway.forceTimeout(requestId);
    }

    // ============ Status Functions ============
    /**
     * @notice Get order status
     * @param orderId The order identifier
     * @return completed Whether the order is completed
     * @return trader The trader address
     */
    function getOrderStatus(bytes32 orderId)
        external
        view
        returns (bool completed, address trader)
    {
        OrderData storage order = orders[orderId];
        return (order.completed, order.trader);
    }

    /**
     * @notice Check if request has timed out
     * @param requestId The request identifier
     * @return Whether the request has timed out
     */
    function hasRequestTimedOut(bytes32 requestId) external view returns (bool) {
        return gateway.isRequestTimedOut(requestId);
    }
}
