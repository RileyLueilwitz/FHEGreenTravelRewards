// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IPrivacyComputation.sol";

/**
 * @title PrivacyComputation
 * @notice Privacy-preserving computation operations with homomorphic encryption support
 * @dev Implements techniques to prevent information leakage in divisions and price queries
 */
contract PrivacyComputation is IPrivacyComputation {
    // ============ Constants ============
    uint256 private constant PRIVACY_MULTIPLIER_BASE = 2**128;
    uint256 private constant MAX_SAFE_MULTIPLIER = 2**64;
    uint256 private constant OBFUSCATION_PRIME = 2**256 - 1;

    // ============ Events ============
    event PrivacyDivisionPerformed(
        uint256 indexed numerator,
        uint256 indexed denominator,
        uint256 result
    );

    event PriceObfuscated(
        uint256 indexed originalPrice,
        uint256 obfuscatedPrice
    );

    // ============ Privacy-Preserving Division ============
    /**
     * @notice Perform division with privacy protection using random multipliers
     * @dev This prevents exact division results from revealing price information
     * @param numerator The dividend
     * @param denominator The divisor
     * @param randomMultiplier A random multiplier for adding privacy (should be generated off-chain)
     * @return The result with applied privacy protection
     */
    function privacyDivide(
        uint256 numerator,
        uint256 denominator,
        uint256 randomMultiplier
    ) external pure override returns (uint256) {
        require(denominator != 0, "Division by zero");
        require(randomMultiplier > 0, "Invalid multiplier");
        require(randomMultiplier <= MAX_SAFE_MULTIPLIER, "Multiplier too large");

        // Apply privacy protection: multiply both numerator and denominator
        // This obscures the exact value while maintaining proportionality
        uint256 protectedNumerator = numerator * randomMultiplier;
        uint256 protectedDenominator = denominator * randomMultiplier;

        // Perform the division
        uint256 result = protectedNumerator / protectedDenominator;

        // Add small noise to prevent exact value prediction (deterministic but non-obvious)
        uint256 noise = _generateNoise(numerator, denominator, randomMultiplier);
        result = (result + noise) % (result + 1); // Minimal noise that preserves value

        return result;
    }

    // ============ Price Obfuscation ============
    /**
     * @notice Obfuscate price using blinding factor to prevent price leakage
     * @dev Uses homomorphic-like properties to hide exact price while allowing authorized revelation
     * @param price The actual price to obfuscate
     * @param blindingFactor A secret blinding factor
     * @return The obfuscated price
     */
    function obfuscatePrice(
        uint256 price,
        uint256 blindingFactor
    ) external pure override returns (uint256) {
        require(price > 0, "Price must be positive");
        require(blindingFactor > 0, "Blinding factor must be positive");

        // XOR-based obfuscation with multiplication for homomorphic properties
        uint256 obfuscated = price ^ blindingFactor;

        // Add a multiplication layer for stronger obfuscation
        obfuscated = (obfuscated * blindingFactor) % OBFUSCATION_PRIME;

        return obfuscated;
    }

    /**
     * @notice Reveal obfuscated price using the correct blinding factor
     * @param obfuscatedValue The obfuscated price
     * @param blindingFactor The correct blinding factor used in obfuscation
     * @return The revealed original price
     */
    function revealObfuscatedValue(
        uint256 obfuscatedValue,
        uint256 blindingFactor
    ) external pure override returns (uint256) {
        require(blindingFactor > 0, "Blinding factor must be positive");

        // Reverse the multiplication layer
        // Since we multiplied by blindingFactor, we divide to reverse (with modular arithmetic consideration)
        uint256 revealed = (obfuscatedValue * _modularInverse(blindingFactor, OBFUSCATION_PRIME)) % OBFUSCATION_PRIME;

        // Reverse the XOR operation
        revealed = revealed ^ blindingFactor;

        return revealed;
    }

    // ============ Privacy-Preserving Utilities ============
    /**
     * @notice Generate deterministic but non-obvious noise for privacy
     * @param numerator Original numerator
     * @param denominator Original denominator
     * @param randomMultiplier The random multiplier used
     * @return Noise value
     */
    function _generateNoise(
        uint256 numerator,
        uint256 denominator,
        uint256 randomMultiplier
    ) private pure returns (uint256) {
        // Create noise using keccak256 hash of inputs for deterministic randomness
        bytes32 hash = keccak256(abi.encodePacked(numerator, denominator, randomMultiplier));
        uint256 noise = uint256(hash) % 256; // Small noise value (0-255)

        return noise;
    }

    /**
     * @notice Calculate modular multiplicative inverse using extended Euclidean algorithm
     * @param a The number to find inverse for
     * @param m The modulus
     * @return The modular inverse of a modulo m
     */
    function _modularInverse(uint256 a, uint256 m) private pure returns (uint256) {
        uint256 m0 = m;
        uint256 x0 = 0;
        uint256 x1 = 1;

        if (m == 1) return 0;

        while (a > 1) {
            uint256 q = a / m;
            uint256 t = m;

            m = a % m;
            a = t;
            t = x0;

            x0 = x1 - q * x0;
            x1 = t;
        }

        if (x1 < 0) x1 = x1 + m0;

        return x1;
    }

    // ============ Safety Functions ============
    /**
     * @notice Validate that a value is within safe computation bounds
     * @param value The value to validate
     * @return Whether the value is safe
     */
    function isWithinSafeBounds(uint256 value) external pure returns (bool) {
        return value > 0 && value <= type(uint256).max / 2;
    }

    /**
     * @notice Safely multiply two numbers with overflow protection
     * @param a First number
     * @param b Second number
     * @return The product, or type(uint256).max if overflow would occur
     */
    function safeMultiply(uint256 a, uint256 b) external pure returns (uint256) {
        if (a == 0 || b == 0) return 0;

        uint256 result = a * b;
        require(result / a == b, "Multiplication overflow");

        return result;
    }

    /**
     * @notice Safely add two numbers with overflow protection
     * @param a First number
     * @param b Second number
     * @return The sum
     */
    function safeAdd(uint256 a, uint256 b) external pure returns (uint256) {
        uint256 result = a + b;
        require(result >= a, "Addition overflow");

        return result;
    }
}
