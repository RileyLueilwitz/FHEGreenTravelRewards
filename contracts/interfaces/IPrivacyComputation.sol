// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IPrivacyComputation
 * @notice Interface for privacy-preserving computation operations
 */
interface IPrivacyComputation {
    /**
     * @notice Perform privacy-preserving division using random multipliers
     * @param numerator The dividend
     * @param denominator The divisor
     * @param randomMultiplier A random multiplier for privacy
     * @return The obfuscated result
     */
    function privacyDivide(
        uint256 numerator,
        uint256 denominator,
        uint256 randomMultiplier
    ) external pure returns (uint256);

    /**
     * @notice Apply price obfuscation using blinding factor
     * @param price The actual price
     * @param blindingFactor The blinding factor
     * @return The obfuscated price
     */
    function obfuscatePrice(
        uint256 price,
        uint256 blindingFactor
    ) external pure returns (uint256);

    /**
     * @notice Reveal obfuscated value with correct factor
     * @param obfuscatedValue The obfuscated value
     * @param blindingFactor The correct blinding factor
     * @return The revealed original value
     */
    function revealObfuscatedValue(
        uint256 obfuscatedValue,
        uint256 blindingFactor
    ) external pure returns (uint256);
}
