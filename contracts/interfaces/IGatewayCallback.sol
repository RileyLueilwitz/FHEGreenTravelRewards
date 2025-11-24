// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IGatewayCallback
 * @notice Interface for contracts receiving decryption callbacks from PrivacyGateway
 */
interface IGatewayCallback {
    /**
     * @notice Called by PrivacyGateway when decryption is complete
     * @param requestId The unique request identifier
     * @param requester The original requester address
     * @param encryptedData The original encrypted data
     * @param decryptedData The decrypted data
     * @return success Whether the callback was processed successfully
     */
    function onDecryptionComplete(
        bytes32 requestId,
        address requester,
        bytes calldata encryptedData,
        bytes calldata decryptedData
    ) external returns (bool);
}
