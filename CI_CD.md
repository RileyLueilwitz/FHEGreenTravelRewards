# CI/CD Documentation

Comprehensive Continuous Integration and Continuous Deployment setup for Private Green Travel Rewards.

## Overview

This project uses **GitHub Actions** for automated testing, code quality checks, security audits, and deployment workflows.

## Table of Contents

- [Workflows](#workflows)
- [Setup Instructions](#setup-instructions)
- [Running Workflows](#running-workflows)
- [Code Quality](#code-quality)
- [Coverage Reporting](#coverage-reporting)
- [Security](#security)
- [Deployment](#deployment)

## Workflows

### 1. Test Suite (`test.yml`)

**Triggers:**
- Push to `main`, `develop`, or `master` branches
- Pull requests to `main`, `develop`, or `master` branches

**Matrix Strategy:**
- Node.js versions: 18.x, 20.x
- Runs tests on both versions in parallel

**Steps:**
1. Checkout code
2. Setup Node.js with caching
3. Install dependencies (`npm ci`)
4. Compile contracts
5. Run test suite
6. Generate coverage report
7. Upload coverage to Codecov

**Jobs:**
- `test` - Run full test suite on multiple Node versions
- `lint` - Code quality checks (Solhint, ESLint, Prettier)
- `gas-report` - Generate gas usage report

### 2. Deploy Workflow (`deploy.yml`)

**Triggers:**
- Manual dispatch via GitHub Actions UI

**Inputs:**
- `network`: Network to deploy to (sepolia, zama)
- `verify`: Whether to verify contract on Etherscan (default: true)

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Compile contracts
5. Deploy to selected network
6. Verify contract (if enabled)
7. Upload deployment artifacts

### 3. Security Audit (`security.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Scheduled: Every Monday at 00:00 UTC

**Jobs:**
- `npm-audit` - Check for vulnerable dependencies
- `dependency-review` - Review dependency changes (PRs only)
- `slither-analysis` - Static analysis of smart contracts

## Setup Instructions

### 1. Repository Secrets

Configure the following secrets in GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `CODECOV_TOKEN` | Codecov upload token | Coverage reporting |
| `PRIVATE_KEY` | Deployer wallet private key | Deployment |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint | Sepolia deployment |
| `ETHERSCAN_API_KEY` | Etherscan API key | Contract verification |

### 2. Enable GitHub Actions

1. Go to repository `Settings > Actions > General`
2. Enable "Allow all actions and reusable workflows"
3. Set workflow permissions to "Read and write permissions"
4. Save settings

### 3. Codecov Integration

1. Sign up at [codecov.io](https://codecov.io)
2. Add your GitHub repository
3. Copy the repository token
4. Add as `CODECOV_TOKEN` secret in GitHub

### 4. Branch Protection Rules

Recommended branch protection for `main`:

```
Settings > Branches > Add rule

Branch name pattern: main

Protect matching branches:
☑ Require a pull request before merging
  ☑ Require approvals: 1
☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Status checks:
    - Test on Node.js 18.x
    - Test on Node.js 20.x
    - Code Quality Checks
☑ Require conversation resolution before merging
☑ Do not allow bypassing the above settings
```

## Running Workflows

### Automatic Triggers

Workflows run automatically on:

```bash
# Push to main/develop
git push origin main

# Create pull request
gh pr create --base main --head feature-branch
```

### Manual Deployment

1. Go to `Actions` tab
2. Select `Deploy Contract` workflow
3. Click `Run workflow`
4. Choose options:
   - Network: `sepolia` or `zama`
   - Verify: `true` or `false`
5. Click `Run workflow`

### Local Testing Before Push

```bash
# Run all checks locally
npm run compile
npm test
npm run lint
npm run format:check

# Or use pre-commit hook (see below)
```

## Code Quality

### Linting Tools

#### Solhint (Solidity Linter)

Configuration: `.solhint.json`

```bash
# Run Solhint
npm run lint:sol

# Auto-fix issues
npm run lint:sol:fix
```

**Rules:**
- Compiler version enforcement
- Function visibility requirements
- Security best practices
- Code style consistency

#### ESLint (JavaScript Linter)

Configuration: `.eslintrc.json`

```bash
# Run ESLint
npm run lint:js

# Auto-fix issues
npm run lint:js:fix
```

#### Prettier (Code Formatter)

Configuration: `.prettierrc.json`

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Pre-Commit Hook

Install Husky for automatic checks:

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npx husky init

# Add pre-commit hook
echo "npm run lint && npm run format:check && npm test" > .husky/pre-commit
chmod +x .husky/pre-commit
```

## Coverage Reporting

### Codecov Configuration

File: `codecov.yml`

**Settings:**
- Minimum coverage: 80%
- Precision: 2 decimal places
- Ignore: tests, scripts, config files

### Generate Coverage Locally

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html  # Mac
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

### Coverage Badges

Add to README.md:

```markdown
[![codecov](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO)
```

### Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Statements | >80% | ~100% |
| Branches | >80% | ~95% |
| Functions | >80% | 100% |
| Lines | >80% | ~100% |

## Security

### Automated Security Checks

#### 1. NPM Audit

Runs on every push and PR:

```bash
# Run locally
npm audit

# Fix vulnerabilities
npm audit fix
```

#### 2. Dependency Review

Automated review of dependency changes in PRs.

#### 3. Slither Static Analysis

Analyzes smart contracts for vulnerabilities:

```bash
# Run locally (requires Python)
pip3 install slither-analyzer
slither contracts/ --filter-paths "node_modules"
```

### Security Best Practices

- ✅ Regular dependency updates
- ✅ Automated vulnerability scanning
- ✅ Static analysis on every PR
- ✅ Manual security reviews
- ✅ Private key management via secrets

## Deployment

### Deployment Process

1. **Prepare**
   ```bash
   npm run compile
   npm test
   ```

2. **Deploy via GitHub Actions**
   - Go to Actions tab
   - Run "Deploy Contract" workflow
   - Select network
   - Monitor deployment

3. **Verify Deployment**
   - Check deployment artifacts
   - Verify contract on Etherscan
   - Test deployed contract

### Deployment Artifacts

After successful deployment, artifacts are available:

- `deployments/` - Deployment records
- `artifacts/` - Compiled contracts
- Retention: 30 days

### Network Configurations

#### Sepolia Testnet

```javascript
{
  url: process.env.SEPOLIA_RPC_URL,
  chainId: 11155111,
  accounts: [process.env.PRIVATE_KEY]
}
```

#### Zama Network

```javascript
{
  url: "https://devnet.zama.ai",
  chainId: 8009,
  accounts: [process.env.PRIVATE_KEY]
}
```

## Workflow Status Badges

Add to README.md:

```markdown
![Test Suite](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Test%20Suite/badge.svg)
![Security Audit](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Security%20Audit/badge.svg)
```

## Troubleshooting

### Workflow Failures

#### Tests Failing

```bash
# Run tests locally
npm test

# Check specific test
npx hardhat test test/specific-test.js
```

#### Linting Errors

```bash
# Fix automatically
npm run lint:fix
npm run format
```

#### Deployment Failures

Common issues:
1. Insufficient balance in deployer wallet
2. Invalid RPC URL
3. Network connection issues
4. Contract compilation errors

**Solution:**
```bash
# Check wallet balance
npx hardhat balance --account YOUR_ADDRESS --network sepolia

# Verify compilation
npm run compile

# Test deployment locally
npm run deploy:local
```

### Coverage Upload Failures

If Codecov upload fails:

1. Verify `CODECOV_TOKEN` secret is set
2. Check coverage file exists: `coverage/lcov.info`
3. Review Codecov action logs
4. Ensure repository is public or Codecov plan supports private repos

### Security Scan Failures

If Slither fails:

1. Review warnings - many are informational
2. Filter false positives in workflow
3. Update Slither version if needed

## Optimization Tips

### Faster CI Runs

1. **Use caching**
   ```yaml
   - uses: actions/cache@v4
     with:
       path: node_modules
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

2. **Parallel jobs**
   - Test matrix runs in parallel
   - Separate lint/test jobs

3. **Skip CI for docs**
   ```
   git commit -m "docs: update README [skip ci]"
   ```

### Resource Usage

| Job | Duration | Resources |
|-----|----------|-----------|
| Test Suite | ~2-3 min | Low |
| Coverage | ~3-4 min | Medium |
| Deployment | ~1-2 min | Low |
| Security | ~3-5 min | Medium |

## Best Practices

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: resolve bug
docs: update documentation
test: add test coverage
ci: update workflow
refactor: improve code structure
```

### Pull Request Workflow

1. Create feature branch
2. Make changes
3. Run local checks
4. Push and create PR
5. Wait for CI to pass
6. Request review
7. Merge after approval

### Version Control

```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: implement new feature"
git push origin feature/new-feature

# Bug fixes
git checkout -b fix/bug-description
git commit -m "fix: resolve issue with..."
git push origin fix/bug-description
```

## Monitoring

### GitHub Actions Dashboard

Monitor workflow runs:
- `Actions` tab in repository
- View logs for failed runs
- Download artifacts
- Re-run failed jobs

### Codecov Dashboard

View coverage trends:
- Coverage over time
- Pull request impact
- File-by-file coverage
- Branch comparison

## Advanced Configuration

### Custom Workflows

Create custom workflow in `.github/workflows/`:

```yaml
name: Custom Workflow

on:
  push:
    branches: [main]

jobs:
  custom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Custom Step
        run: echo "Custom workflow"
```

### Environment-Specific Deployments

```yaml
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  # Staging deployment steps

deploy-production:
  if: github.ref == 'refs/heads/main'
  # Production deployment steps
```

## Resources

### Documentation
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)
- [Solhint Rules](https://github.com/protofire/solhint)
- [Hardhat Testing](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)

### Tools
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Workflow Visualizer](https://github.com/githubocto/repo-visualizer)
- [Action Status](https://www.githubstatus.com/)

## Summary

✅ **Automated Testing** - Multi-version Node.js testing
✅ **Code Quality** - Solhint, ESLint, Prettier
✅ **Coverage** - Codecov integration with 80% target
✅ **Security** - NPM audit, dependency review, Slither analysis
✅ **Deployment** - Automated deployment workflows
✅ **Monitoring** - Real-time status and reporting

**CI/CD Status: Production Ready** 🚀

---

**Last Updated:** 2024-10-25
**Workflows:** 3 active
**Coverage Target:** >80%
**Status:** ✅ Fully Configured
