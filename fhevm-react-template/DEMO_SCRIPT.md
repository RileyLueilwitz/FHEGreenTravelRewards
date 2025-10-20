# 🎬 Demo Video Script - Private Green Travel Rewards

**Duration:** ~5 minutes
**Format:** Screen recording + voiceover
**Target Audience:** Zama FHE Challenge judges and blockchain developers

---

## 📋 Pre-Recording Checklist

- [ ] Contract deployed on Sepolia testnet
- [ ] Etherscan verification completed
- [ ] Test accounts funded with Sepolia ETH
- [ ] Screen recording software ready (OBS, Loom, etc.)
- [ ] Microphone tested and working
- [ ] Browser windows prepared (Etherscan, terminal, documentation)
- [ ] Demo script practiced at least once

---

## 🎥 Video Structure

### Scene 1: Introduction (30 seconds)
**Visual:** Project README on screen
**Narration:**

```
"Hello! I'm excited to present Private Green Travel Rewards - a privacy-preserving
incentive system for sustainable transportation, built on Zama's FHEVM.

The problem we're solving is simple: How do we reward people for eco-friendly travel
choices without tracking their movements or exposing their personal data?

Using Fully Homomorphic Encryption, users can submit carbon savings from walking,
cycling, or public transport - and receive tiered rewards - all while keeping their
individual travel patterns completely private."
```

**Show on screen:**
- Project title and tagline
- Key badges (Tests, Coverage, Security)
- Quick bullet points of features

---

### Scene 2: Architecture Overview (45 seconds)
**Visual:** PROJECT_OVERVIEW.md architecture diagrams
**Narration:**

```
"The system uses a three-layer architecture:

First, the USER LAYER - where participants use MetaMask to encrypt their carbon
savings client-side using the fhevmjs SDK. The encryption happens before any data
leaves their browser.

Second, the SMART CONTRACT LAYER - our Solidity contract stores all data as encrypted
ciphertexts - specifically euint32 types. It performs homomorphic operations like
addition and comparison directly on encrypted data using TFHE operations.

Third, the ZAMA FHEVM LAYER - which provides the encrypted computation infrastructure,
threshold decryption network, and oracle callbacks for reward processing.

The key innovation here is that rewards are calculated on encrypted data without ever
exposing individual amounts - not even to the contract owner."
```

**Show on screen:**
- Architecture diagram with three layers
- Data flow animation (if possible)
- Highlight FHE encryption types (euint32, ebool)

---

### Scene 3: Smart Contract Code Walkthrough (60 seconds)
**Visual:** VS Code with PrivateGreenTravelRewards.sol open
**Narration:**

```
"Let's look at the smart contract implementation.

Here's our encrypted storage - we use a mapping of addresses to euint32, which are
encrypted 32-bit unsigned integers. This stores each participant's carbon savings
completely encrypted on-chain.

[Scroll to submitTravelData function]

When a user submits their travel data, we convert the incoming encrypted bytes to a
euint32 type. The data never exists in plaintext on the blockchain.

[Scroll to calculateTier function]

For reward calculation, we perform homomorphic comparisons. TFHE.ge checks if the
encrypted value is greater than or equal to our thresholds - 10,000 grams for Gold,
5,000 for Silver. The comparison happens on encrypted data and returns an encrypted
boolean.

[Highlight TFHE.select]

Then we use TFHE.select for conditional logic - it's like a ternary operator but works
on encrypted values. This assigns rewards based on the encrypted tier without revealing
the exact amount saved.

All of these operations preserve encryption end-to-end."
```

**Show on screen:**
- Key functions: submitTravelData, calculateTier, endPeriod
- Highlight FHE operations: TFHE.asEuint32, TFHE.ge, TFHE.select
- Show comments explaining privacy guarantees

---

### Scene 4: Live Testing Demo (75 seconds)
**Visual:** Terminal with test output
**Narration:**

```
"Now let's run our comprehensive test suite to verify everything works correctly.

[Run: npm test]

We have 54 tests covering all aspects of the contract - deployment, period management,
submissions, reward processing, access control, and edge cases.

[Wait for tests to run]

Great! All 54 tests passing. Notice the test execution time - about 12 seconds for the
complete suite.

[Run: npm run test:coverage]

And here's our coverage report - we have over 95% code coverage across all functions
and branches. This ensures our privacy-preserving logic is thoroughly tested.

[Run: npm run test:gas]

Let's also check gas usage. As you can see, submitting travel data costs around
149,000 gas, which is reasonable considering the FHE operations involved. The
overhead compared to standard contracts is about 30-50%, which is acceptable for
privacy guarantees."
```

**Show on screen:**
- Test suite running with green checkmarks
- Coverage percentages (95%+)
- Gas report table
- Highlight key metrics

---

### Scene 5: Sepolia Deployment (45 seconds)
**Visual:** Terminal + Etherscan browser window
**Narration:**

```
"The contract is deployed on Sepolia testnet and fully verified on Etherscan.

[Show Etherscan page]

Here's our verified contract at address 0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B.
You can see the source code is publicly available and matches our repository exactly.

[Click on 'Read Contract' tab]

The read functions let anyone query public information like the current period status,
participant counts, and period history.

[Click on 'Write Contract' tab]

And the write functions allow interaction - submitting travel data, claiming rewards,
and for the owner, managing periods and processing participants.

The transparency of a verified contract combined with FHE privacy creates a powerful
combination - verifiable logic with protected data."
```

**Show on screen:**
- Etherscan contract page
- Verified green checkmark
- Contract source code tab
- Read/Write function tabs

---

### Scene 6: Live Workflow Simulation (60 seconds)
**Visual:** Terminal running interact.js or simulate.js
**Narration:**

```
"Let's simulate a complete reward period using our interactive script.

[Run: npm run simulate]

First, we start a new 7-day period. The contract owner calls startNewPeriod, which
emits a PeriodStarted event.

Now we simulate three participants submitting their carbon savings:
- Alice saves 3,500 grams from cycling - Bronze tier
- Bob saves 7,200 grams from public transport - Silver tier
- Charlie saves 12,000 grams from a car-free week - Gold tier

All these amounts are encrypted when submitted - the contract only sees ciphertexts.

[Show fast-forward simulation]

We fast-forward 7 days... In production, this would be actual time passage. The period
is now complete.

The owner calls endPeriod, which requests FHE decryption from the Zama network. The
oracle responds with tier information - not exact amounts, maintaining privacy.

[Show reward processing]

Now we process each participant. Alice gets 10 tokens for Bronze, Bob gets 25 for
Silver, and Charlie gets 50 for Gold tier.

Finally, participants can claim their rewards anytime. The token transfers are public
as standard ERC20, but the original carbon savings remain encrypted forever."
```

**Show on screen:**
- Simulation console output
- Period lifecycle stages
- Participant submissions with amounts
- Reward distribution summary
- Final statistics

---

### Scene 7: Privacy Model Explanation (45 seconds)
**Visual:** Documentation showing privacy model
**Narration:**

```
"Let's clarify what's private and what's public in our system.

PRIVATE - completely encrypted:
- Individual carbon savings amounts
- Exact submission values
- Homomorphic computation intermediates
- User travel patterns

PUBLIC - visible on blockchain:
- Participation existence - people can see you participated
- Participant count per period
- Period metadata like start and end times
- Final reward claims - the token amounts

The key insight is that even though reward tiers become known after claiming, the
exact carbon savings remain encrypted. So if you get a Silver tier reward, observers
know you saved between 5,000 and 9,999 grams - but not your exact 7,200 grams.

This strikes a balance between privacy and verifiability - enough transparency to
prove the system works fairly, but maximum privacy for personal data."
```

**Show on screen:**
- Privacy model table
- What's Private vs What's Public
- Decryption permissions diagram
- Example scenarios

---

### Scene 8: Technical Highlights (30 seconds)
**Visual:** Documentation and code snippets
**Narration:**

```
"Some technical highlights that make this production-ready:

We have 54 comprehensive tests with 95% coverage - exceeding typical test requirements.

Full CI/CD pipeline with GitHub Actions - automated testing on Node 18 and 20, security
scans with Solhint and Slither, and coverage reporting.

Gas optimization with Solidity compiler runs set to 200 and Yul optimizer enabled -
balancing deployment and runtime costs.

Comprehensive documentation with setup guides, API reference, and troubleshooting.

And we follow security best practices - reentrancy protection, access control, input
validation, and pre-commit hooks with Husky for quality gates.

All of this makes it ready for real-world deployment."
```

**Show on screen:**
- Test coverage report
- CI/CD workflow badges
- Gas optimization settings
- Documentation structure
- Security checklist

---

### Scene 9: Real-World Impact (30 seconds)
**Visual:** PROJECT_OVERVIEW.md use cases section
**Narration:**

```
"The real-world applications are exciting:

Cities could deploy this to incentivize sustainable commuting without surveilling
residents.

Companies can run employee green travel programs that respect privacy.

Universities can reward students for eco-friendly campus transportation.

And blockchain communities can use it as a privacy-preserving governance tool.

The model is scalable, regulatory-compliant, and solves a real problem - encouraging
climate action while protecting civil liberties.

It demonstrates that privacy and transparency aren't opposites - with FHE, we can have
both."
```

**Show on screen:**
- Use case bullet points
- Market opportunity stats
- Impact metrics (CO2 savings potential)
- Future roadmap

---

### Scene 10: Closing & Call to Action (30 seconds)
**Visual:** README with project links
**Narration:**

```
"To summarize, Private Green Travel Rewards demonstrates the practical power of Fully
Homomorphic Encryption in a real-world application.

We've built a privacy-preserving incentive system with:
- Complete user privacy through FHE encryption
- Trustless operation via smart contracts
- Production-ready code quality with comprehensive testing
- Real-world utility for climate action

All code is open-source under MIT license and available in our repository.

We'd love your feedback and thank you to the Zama team for making FHEVM possible and
running this challenge.

Thank you for watching, and let's build a more private and sustainable future together!"
```

**Show on screen:**
- Project summary slide
- GitHub repository link
- Contact information
- Zama FHE Challenge logo
- Thank you message

---

## 🎬 Post-Production Checklist

- [ ] Edit out any mistakes or long pauses
- [ ] Add title cards for each section
- [ ] Include captions/subtitles (optional but recommended)
- [ ] Add background music (low volume, non-distracting)
- [ ] Include project name and URL in video description
- [ ] Export in 1080p, 60fps if possible
- [ ] Compress to reasonable file size (< 500MB)
- [ ] Test video playback before submission
- [ ] Upload to YouTube (unlisted) or include in submission
- [ ] Name file: `demo.mp4`

---

## 📝 Video Description Template

```
Private Green Travel Rewards - Zama FHE Challenge Submission

A privacy-preserving blockchain incentive system for sustainable transportation,
built on Zama's FHEVM.

🔐 Features:
- FHE-encrypted carbon savings submission
- Tiered rewards (Bronze/Silver/Gold)
- Zero-knowledge reward processing
- 54 comprehensive tests, 95%+ coverage
- Production-ready CI/CD pipeline
- Deployed on Sepolia testnet

🏗️ Built With:
- Zama FHEVM 0.5.0
- Solidity 0.8.24
- Hardhat 2.19.0
- Ethers.js v6

📚 Resources:
- GitHub: [repository-url]
- Documentation: [docs-url]
- Contract: 0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B

🙏 Thanks to Zama for pioneering FHE technology!

#ZamaFHE #Privacy #Blockchain #Web3 #Sustainability #GreenTech
```

---

## 🎯 Key Talking Points Summary

1. **Problem:** Privacy concerns limit adoption of green incentive programs
2. **Solution:** FHE enables rewards without exposing personal data
3. **Innovation:** Homomorphic operations on encrypted carbon savings
4. **Quality:** 54 tests, 95% coverage, production-ready
5. **Impact:** Scalable model for cities, companies, communities
6. **Technical:** TFHE operations, three-layer architecture
7. **Deployment:** Live on Sepolia, verified on Etherscan
8. **Privacy:** Individual amounts encrypted, tier assignments public
9. **Use Cases:** Cities, corporations, universities, DAOs
10. **Future:** Mainnet launch, mobile apps, ecosystem growth

---

## 📊 Demo Statistics to Highlight

- **54 tests** (120% of typical requirement)
- **95%+ code coverage**
- **482 lines** of smart contract code
- **~149k gas** per submission
- **3 FHE encryption types** used (euint32, euint64, ebool)
- **7-day period** cycles
- **3 reward tiers** (Bronze/Silver/Gold)
- **Zero plaintext** exposure on-chain

---

## 🔧 Technical Setup for Recording

### Terminal Setup
```bash
# Clean terminal history
clear
history -c

# Set up nice prompt
export PS1="\[\033[01;32m\]\u\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "

# Increase terminal font size for recording
# Terminal → Preferences → Profiles → Text → Font size: 16-18pt

# Enable colorized output
export CLICOLOR=1
```

### Browser Setup
```
1. Open multiple tabs:
   - Tab 1: README.md
   - Tab 2: Etherscan contract page
   - Tab 3: PROJECT_OVERVIEW.md

2. Set zoom to 125% for better visibility

3. Close unnecessary browser extensions

4. Use incognito/private mode for clean appearance
```

### Screen Recording Settings
```
- Resolution: 1920x1080 (1080p)
- Frame rate: 60fps (or 30fps minimum)
- Audio: Enable microphone
- Codec: H.264 for compatibility
- Bitrate: 5-10 Mbps
```

---

**Good luck with your demo recording! 🎬**

**Remember:** Be enthusiastic, speak clearly, and let your passion for privacy-preserving technology shine through!

---

**Last Updated:** October 25, 2024
**Version:** 1.0.0
