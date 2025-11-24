// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../contracts/interfaces/IGatewayCallback.sol";

/**
 * @title MockCallback
 * @notice Mock callback contract for testing PrivacyGateway
 */
contract MockCallback is IGatewayCallback {
    bool public shouldFail = false;

    event CallbackExecuted(bytes32 indexed requestId, address indexed requester);

    function onDecryptionComplete(
        bytes32 requestId,
        address requester,
        bytes calldata encryptedData,
        bytes calldata decryptedData
    ) external override returns (bool) {
        if (shouldFail) {
            return false;
        }

        emit CallbackExecuted(requestId, requester);
        return true;
    }

    function setShouldFail(bool fail) external {
        shouldFail = fail;
    }
}
