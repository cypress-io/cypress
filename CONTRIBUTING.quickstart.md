# Cypress Contributor Quick Start Guide

Welcome! This guide gets you coding on Cypress in under 15 minutes. Skip the overwhelming details and focus on the essentials to start contributing effectively.

## 🚀 Quick Setup (5 minutes)

### Prerequisites
```bash
# Check your Node.js version (required: ^20.1.0 || ^22.0.0 || >=24.0.0)
node --version

# If wrong version, use nvm
nvm install 22.0.0
nvm use 22.0.0
```

### Clone and Bootstrap
```bash
# Clone the repo
git clone https://github.com/cypress-io/cypress.git
cd cypress

# Install dependencies (this takes a few minutes)
yarn install

# Verify everything works
yarn workspace @packages/driver test:unit:ci --run
```

**✅ Success indicator**: You should see tests passing without errors.

## 🎯 High-Impact Areas (Pick Your Battle)

### 1. 🐛 Quick Bug Fixes
**Where**: `packages/driver/src/` - Core test execution logic
**Why**: Direct user impact, well-defined problems
**Start here**: Issues labeled `good first issue` + `driver`

### 2. 🔧 CLI Improvements  
**Where**: `cli/lib/` - Command-line interface
**Why**: Affects every Cypress user, easier to test locally
**Start here**: Issues labeled `cli` + `enhancement`

### 3. 📚 Component Testing
**Where**: `npm/react/`, `npm/vue/`, `npm/vite-dev-server/`
**Why**: Growing area, lots of room for improvement
**Start here**: Issues labeled `component testing`

### 4. 🧪 Test Infrastructure
**Where**: `system-tests/`, `packages/*/test/`
**Why**: Improve DX for all contributors
**Start here**: Flaky test issues, missing test coverage

## 💻 Essential Development Workflows

### Run Specific Package Tests
```bash
# Driver (core test execution)
yarn workspace @packages/driver test:unit

# CLI (command-line interface)  
cd cli && yarn test

# Server (backend logic)
yarn workspace @packages/server test:unit

# Component testing (React example)
yarn workspace @cypress/react test
```

### Build and Test Locally
```bash
# Build everything (rarely needed)
yarn build

# Build specific package
yarn workspace @packages/driver build

# Run system tests (integration tests)
yarn test:ci:system-tests:chrome:specs
```

### Debug Like a Pro
```bash
# Enable debug output
export DEBUG="cypress:*"

# Run Cypress with your changes
yarn cypress:open

# Or test specific functionality
yarn workspace @packages/driver cy:open
```

## 🛠️ Project Structure (Just the Essentials)

```
cypress/
├── packages/           # Core packages
│   ├── driver/        # Test execution engine ⭐
│   ├── server/        # Backend API ⭐  
│   ├── app/          # Desktop app UI
│   └── ...
├── cli/              # Command-line interface ⭐
├── npm/              # Framework integrations ⭐
│   ├── react/        # React component testing
│   ├── vue/          # Vue component testing
│   └── vite-dev-server/ # Vite integration
├── system-tests/     # End-to-end tests ⭐
└── guides/          # Development docs
```

**⭐ = High contribution activity**

## 🔥 Common Commands (Copy-Paste Ready)

### Daily Development
```bash
# Start developing
git checkout develop && git pull origin develop
git checkout -b feature/my-awesome-change

# Run tests while coding
yarn workspace @packages/driver test:unit --watch

# Check your changes work end-to-end
yarn cypress:open

# Before committing
yarn lint
```

### Debugging Failing Tests
```bash
# Run specific test file
yarn workspace @packages/driver test:unit cypress/integration/commands/actions/click_spec.js

# Run with browser debugging
yarn workspace @packages/driver test:debug

# Run system test for specific feature  
yarn test:ci:system-tests:chrome --spec "cypress/e2e/commands/actions.cy.js"
```

### PR Preparation
```bash
# Lint and fix common issues
yarn lint --fix

# Run affected tests
yarn test:ci:affected --base=develop

# Build and verify
yarn build && yarn cypress:verify
```

## 🎬 Your First Contribution (15-minute walkthrough)

### Step 1: Find an Issue (2 min)
1. Go to [Cypress Issues](https://github.com/cypress-io/cypress/issues)
2. Filter: `label:"good first issue"` + `label:"help wanted"`
3. Pick something tagged `driver`, `cli`, or `component testing`
4. Comment: "I'd like to work on this"

### Step 2: Set Up Branch (1 min)
```bash
git checkout develop
git pull origin develop  
git checkout -b fix/issue-XXXXX-description
```

### Step 3: Make Your Change (10 min)
Focus on the minimal change that fixes the issue:
- **Driver**: Usually in `packages/driver/src/`
- **CLI**: Usually in `cli/lib/` 
- **Component Testing**: Usually in `npm/{framework}/`

### Step 4: Test It (2 min)
```bash
# Run relevant tests
yarn workspace @packages/driver test:unit --grep "your test description"

# Test manually if needed
yarn cypress:open
```

## 🚨 Common Gotchas (Save Yourself Time)

### "Tests pass locally but fail in CI"
- **Cause**: Missing `await` or race conditions
- **Fix**: Add proper async/await, check system-tests

### "Yarn install fails"
- **Cause**: Node version mismatch or cache issues
- **Fix**: `nvm use 22 && yarn cache clean && yarn install`

### "Cannot find module @packages/xyz"  
- **Cause**: Workspace linking issues
- **Fix**: `yarn install` from project root (not inside packages)

### "Changes don't seem to take effect"
- **Cause**: Need to rebuild package
- **Fix**: `yarn workspace @packages/driver build`

## 🔍 Finding Your Way Around

### Key Files to Know
```bash
# Where commands are implemented  
packages/driver/src/cy/commands/

# Where assertions live
packages/driver/src/cy/assertions.ts

# CLI command definitions
cli/lib/commands/

# Error messages and codes
cli/lib/errors.ts
packages/driver/src/cypress/error_messages.js

# Integration test examples
system-tests/projects/
```

### Who to Ask
- **Driver/Core**: `@cypress/driver-team`
- **CLI**: `@cypress/cli-team`  
- **Component Testing**: `@cypress/component-team`
- **General**: `#contributors` in [Discord](https://discord.gg/cypress)

## 🎯 Pro Tips

### 1. Start Small
- Fix typos, improve error messages, add tests
- Build confidence before tackling complex features

### 2. Read Related Tests
- Tests are often better documentation than docs
- Look at `*.spec.js` files in the same directory

### 3. Use the Debugger
```javascript
// In driver code
cy.then(() => {
  debugger; // Pause execution in DevTools
})
```

### 4. Check Existing Solutions
```bash
# Search codebase for similar implementations
git grep -r "similar functionality"

# Check if there's a utility function
git grep -r "function.*helper"
```

## 📈 Level Up Your Contributions

### After Your First PR
1. **Ask for more challenging issues** - Mention your successful PR
2. **Review other PRs** - Great way to learn the codebase
3. **Improve documentation** - Always needed, high impact
4. **Fix flaky tests** - Huge value to the team

### Become a Power Contributor
- **Own an area**: Become the go-to person for React component testing, CLI, etc.
- **Write RFCs**: Propose new features in `guides/`
- **Mentor others**: Help new contributors in Discord

## 📚 What's Next?

### Essential Reading (in order)
1. This guide (you're here!)
2. [CONTRIBUTING.md](../CONTRIBUTING.md) - Full contributor guide
3. [guides/testing-strategy-and-styleguide.md](../guides/testing-strategy-and-styleguide.md)
4. Package-specific READMEs in your area of interest

### Advanced Topics
- [guides/typescript.md](../guides/typescript.md) - TypeScript patterns
- [guides/testing-other-projects.md](../guides/testing-other-projects.md) - Testing strategy
- [guides/release-process.md](../guides/release-process.md) - How releases work

---

**🎉 Ready to contribute?** Pick an issue and dive in! The Cypress community is here to help.

**❓ Questions?** 
- [Discord #contributors](https://discord.gg/cypress)
- [GitHub Discussions](https://github.com/cypress-io/cypress/discussions)
- Comment on your chosen issue

**Remember**: Every expert was once a beginner. Your fresh perspective is valuable!