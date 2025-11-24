const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivacyComputation", function () {
  let privacyComputation;

  beforeEach(async function () {
    const PrivacyComputation = await ethers.getContractFactory("PrivacyComputation");
    privacyComputation = await PrivacyComputation.deploy();
    await privacyComputation.waitForDeployment();
  });

  describe("Privacy Division", function () {
    it("Should perform privacy division with random multiplier", async function () {
      const numerator = ethers.parseEther("100");
      const denominator = ethers.parseEther("2");
      const randomMultiplier = BigInt(12345);

      const result = await privacyComputation.privacyDivide(
        numerator,
        denominator,
        randomMultiplier
      );

      expect(result).to.be.gt(0);
    });

    it("Should reject division by zero", async function () {
      const numerator = ethers.parseEther("100");
      const denominator = 0;
      const randomMultiplier = BigInt(12345);

      await expect(
        privacyComputation.privacyDivide(numerator, denominator, randomMultiplier)
      ).to.be.revertedWith("Division by zero");
    });

    it("Should reject zero multiplier", async function () {
      const numerator = ethers.parseEther("100");
      const denominator = ethers.parseEther("2");
      const randomMultiplier = 0;

      await expect(
        privacyComputation.privacyDivide(numerator, denominator, randomMultiplier)
      ).to.be.revertedWith("Invalid multiplier");
    });

    it("Should reject multiplier that is too large", async function () {
      const numerator = ethers.parseEther("100");
      const denominator = ethers.parseEther("2");
      const maxMultiplier = BigInt(2) ** BigInt(64);
      const tooLargeMultiplier = maxMultiplier + BigInt(1);

      await expect(
        privacyComputation.privacyDivide(numerator, denominator, tooLargeMultiplier)
      ).to.be.revertedWith("Multiplier too large");
    });

    it("Should provide consistent but non-obvious results", async function () {
      const numerator = ethers.parseEther("100");
      const denominator = ethers.parseEther("2");
      const multiplier1 = BigInt(111);
      const multiplier2 = BigInt(222);

      const result1 = await privacyComputation.privacyDivide(
        numerator,
        denominator,
        multiplier1
      );
      const result2 = await privacyComputation.privacyDivide(
        numerator,
        denominator,
        multiplier2
      );

      // Results should be different (privacy protection)
      expect(result1).to.not.equal(result2);

      // But both should be reasonable
      expect(result1).to.be.gt(0);
      expect(result2).to.be.gt(0);
    });
  });

  describe("Price Obfuscation", function () {
    it("Should obfuscate price", async function () {
      const price = BigInt(1000);
      const blindingFactor = BigInt(98765);

      const obfuscated = await privacyComputation.obfuscatePrice(price, blindingFactor);

      expect(obfuscated).to.not.equal(price);
      expect(obfuscated).to.be.gt(0);
    });

    it("Should reveal obfuscated price with correct factor", async function () {
      const price = BigInt(1000);
      const blindingFactor = BigInt(98765);

      const obfuscated = await privacyComputation.obfuscatePrice(price, blindingFactor);
      const revealed = await privacyComputation.revealObfuscatedValue(
        obfuscated,
        blindingFactor
      );

      expect(revealed).to.equal(price);
    });

    it("Should fail to reveal with incorrect factor", async function () {
      const price = BigInt(1000);
      const blindingFactor = BigInt(98765);
      const wrongFactor = BigInt(12345);

      const obfuscated = await privacyComputation.obfuscatePrice(price, blindingFactor);
      const revealed = await privacyComputation.revealObfuscatedValue(
        obfuscated,
        wrongFactor
      );

      expect(revealed).to.not.equal(price);
    });

    it("Should reject zero price", async function () {
      const price = 0;
      const blindingFactor = BigInt(98765);

      await expect(
        privacyComputation.obfuscatePrice(price, blindingFactor)
      ).to.be.revertedWith("Price must be positive");
    });

    it("Should reject zero blinding factor", async function () {
      const price = BigInt(1000);
      const blindingFactor = 0;

      await expect(
        privacyComputation.obfuscatePrice(price, blindingFactor)
      ).to.be.revertedWith("Blinding factor must be positive");
    });

    it("Should handle multiple obfuscations", async function () {
      const prices = [BigInt(100), BigInt(500), BigInt(1000)];
      const factors = [BigInt(111), BigInt(222), BigInt(333)];

      const obfuscatedPrices = [];
      for (let i = 0; i < prices.length; i++) {
        const obfuscated = await privacyComputation.obfuscatePrice(prices[i], factors[i]);
        obfuscatedPrices.push(obfuscated);
      }

      // All obfuscated prices should be different
      for (let i = 0; i < obfuscatedPrices.length - 1; i++) {
        expect(obfuscatedPrices[i]).to.not.equal(obfuscatedPrices[i + 1]);
      }

      // All should reveal correctly
      for (let i = 0; i < prices.length; i++) {
        const revealed = await privacyComputation.revealObfuscatedValue(
          obfuscatedPrices[i],
          factors[i]
        );
        expect(revealed).to.equal(prices[i]);
      }
    });
  });

  describe("Safety Functions", function () {
    it("Should validate safe bounds", async function () {
      expect(await privacyComputation.isWithinSafeBounds(BigInt(100))).to.be.true;
      expect(await privacyComputation.isWithinSafeBounds(0)).to.be.false;
    });

    it("Should safely multiply without overflow", async function () {
      const a = BigInt(100);
      const b = BigInt(200);

      const result = await privacyComputation.safeMultiply(a, b);
      expect(result).to.equal(BigInt(20000));
    });

    it("Should handle zero multiplication", async function () {
      const a = 0;
      const b = BigInt(200);

      const result = await privacyComputation.safeMultiply(a, b);
      expect(result).to.equal(0);
    });

    it("Should safely add without overflow", async function () {
      const a = BigInt(1000);
      const b = BigInt(2000);

      const result = await privacyComputation.safeAdd(a, b);
      expect(result).to.equal(BigInt(3000));
    });

    it("Should detect multiplication overflow", async function () {
      const maxUint = BigInt(2) ** BigInt(256) - BigInt(1);
      const a = maxUint;
      const b = BigInt(2);

      await expect(
        privacyComputation.safeMultiply(a, b)
      ).to.be.revertedWith("Multiplication overflow");
    });

    it("Should detect addition overflow", async function () {
      const maxUint = BigInt(2) ** BigInt(256) - BigInt(1);
      const a = maxUint;
      const b = BigInt(1);

      await expect(
        privacyComputation.safeAdd(a, b)
      ).to.be.revertedWith("Addition overflow");
    });
  });

  describe("Price Obfuscation Round Trip", function () {
    it("Should correctly round-trip multiple prices", async function () {
      const testCases = [
        { price: BigInt(100), factor: BigInt(999) },
        { price: BigInt(5000), factor: BigInt(12345) },
        { price: BigInt(999999), factor: BigInt(777777) },
      ];

      for (const testCase of testCases) {
        const obfuscated = await privacyComputation.obfuscatePrice(
          testCase.price,
          testCase.factor
        );
        const revealed = await privacyComputation.revealObfuscatedValue(
          obfuscated,
          testCase.factor
        );

        expect(revealed).to.equal(testCase.price);
      }
    });
  });

  describe("Privacy Division Edge Cases", function () {
    it("Should handle large numbers", async function () {
      const largeNum = ethers.parseEther("1000000");
      const smallNum = ethers.parseEther("2");
      const multiplier = BigInt(65535);

      const result = await privacyComputation.privacyDivide(
        largeNum,
        smallNum,
        multiplier
      );

      expect(result).to.be.gt(0);
    });

    it("Should handle numbers with same numerator and denominator", async function () {
      const num = ethers.parseEther("100");
      const multiplier = BigInt(54321);

      const result = await privacyComputation.privacyDivide(num, num, multiplier);

      expect(result).to.be.gt(0);
    });
  });
});
