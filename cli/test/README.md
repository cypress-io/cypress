# Cypress CLI Test Suite

This directory contains the test suite for the Cypress CLI package. The tests ensure that the command-line interface behaves correctly across different environments and scenarios.

## Test Structure

### Directory Layout

```
test/
├── README.md                    # This file
├── lib/                        
│   ├── tasks/
│   │   ├── verify.spec.ts      # Tests for binary verification
│   │   ├── install.spec.ts     # Tests for installation process
│   │   └── ...
│   ├── util.spec.ts            # Utility function tests
│   └── ...
└── fixtures/                   # Test data and mock files
```

### Key Test Files

#### `lib/tasks/verify.spec.ts`
**Purpose**: Tests the binary verification process that ensures a downloaded Cypress binary is valid and executable.

**What it covers**:
- **Given**: A Cypress binary installation (various states: missing, corrupted, valid)
- **When**: User runs `cypress verify` or verification happens automatically 
- **Then**: Should correctly identify binary status and provide helpful error messages

**Key scenarios tested**:
- ✅ Binary exists and is valid → verification succeeds
- ❌ Binary missing → shows installation instructions
- ❌ Binary corrupted → provides troubleshooting steps
- ❌ Binary not executable → suggests permission fixes
- 🖥️ Platform-specific behavior (Windows, macOS, Linux)
- 🔄 Retry logic and timeout handling

**Mock Infrastructure**: Uses `createfs()` helper to simulate different file system states without requiring actual binary installations.

## Running Tests

### Prerequisites

Ensure you have Node.js and Yarn installed:
- Node.js: ^20.1.0 || ^22.0.0 || >=24.0.0
- Yarn: Latest stable

### Commands

```bash
# Run all CLI tests
cd cli && yarn test

# Run specific test file  
cd cli && yarn test lib/tasks/verify.spec.ts

# Run tests in watch mode (development)
cd cli && yarn test --watch

# Run tests with debug output
cd cli && yarn test-debug

# Run specific test by pattern
cd cli && yarn test --grep "should verify successfully"
```

### Test Environment Setup

The test suite uses several mocking strategies:

1. **File System Mocking**: `mock-fs` to simulate binary installations
2. **Process Mocking**: Mock system calls and process execution
3. **Network Mocking**: Mock download and HTTP requests

## Understanding Test Output

### Successful Run
```bash
✓ lib/tasks/verify.spec.ts (45 tests passed)
✓ lib/util.spec.ts (12 tests passed)

Test Files: 2 passed
Tests: 57 passed
Time: 2.3s
```

### Failed Test Example
```bash
❯ should verify binary successfully
  Expected: true
  Received: false
  
  at verify.spec.ts:123:45
    121 |   expect(result.success).toBe(true)
    122 |   expect(result.code).toBe(0)
  > 123 |   expect(result.verified).toBe(true)
        |                          ^
```

### Common Test Patterns

#### 1. Given/When/Then Structure
```typescript
it('should handle missing binary gracefully', () => {
  // Given: No binary is installed
  createfs({ 
    alreadyVerified: false, 
    executable: false, 
    packageVersion: '13.0.0' 
  })
  
  // When: User attempts verification
  const result = await verify()
  
  // Then: Should show helpful error message
  expect(result.success).toBe(false)
  expect(result.message).toContain('Please reinstall Cypress')
})
```

#### 2. Error Scenario Testing  
```typescript
it('should timeout gracefully', () => {
  // Given: Slow binary that will timeout
  mockSlowExecution()
  
  // When: Verification runs with timeout
  const result = await verify({ timeout: 1000 })
  
  // Then: Should fail with timeout message
  expect(result.error).toContain('verification timed out')
})
```

## Debugging Failed Tests

### 1. Check Mock Setup
Ensure your test properly mocks all external dependencies:
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  mockfs.restore() // Clean file system mocks
})
```

### 2. Examine File System State
The `createfs()` helper logs the file system structure:
```typescript
// Add debug logging
console.log('Mock FS structure:', mockfs.getMockStructure())
```

### 3. Check Environment Variables
Some tests depend on environment setup:
```typescript
// Common environment variables that affect tests
process.env.CYPRESS_CACHE_FOLDER
process.env.CYPRESS_RUN_BINARY  
process.env.DEBUG = 'cypress:cli*' // Enable debug logs
```

## Writing New Tests

### 1. File System Tests
Use the `createfs()` helper for consistent mocking:

```typescript
it('should handle custom installation directory', () => {
  createfs({
    alreadyVerified: true,
    executable: true, 
    packageVersion: '13.0.0',
    customDir: '/my/custom/cypress'
  })
  
  // Test your scenario...
})
```

### 2. Error Handling Tests
Always test both success and failure paths:

```typescript
describe('error scenarios', () => {
  it('should handle permission errors', () => {
    // Setup scenario that triggers permission error
    // Verify error message and suggested solution
  })
  
  it('should handle network timeouts', () => {
    // Mock network failure
    // Verify retry logic and fallback behavior
  })
})
```

### 3. Platform-Specific Tests
Use conditional testing for platform differences:

```typescript
describe('platform-specific behavior', () => {
  beforeEach(() => {
    vi.mocked(os.platform).mockReturnValue('darwin') // or 'win32', 'linux'
  })
  
  it('should use correct executable path on macOS', () => {
    // Test macOS-specific logic
  })
})
```

## Test Configuration

The test suite is configured via:
- `vitest.config.ts` - Main test configuration
- `package.json` - Test scripts and timeouts
- `tsconfig.json` - TypeScript configuration for tests

## Coverage Reports

Generate test coverage:
```bash
cd cli && yarn test --coverage
```

This creates a coverage report showing which parts of the CLI code are tested.

## Contributing

When adding new CLI features:

1. **Write tests first** (TDD approach)
2. **Cover error cases** - CLI tools especially need robust error handling
3. **Test cross-platform** - Use mocks to simulate different operating systems
4. **Document test purpose** - Add clear descriptions of what each test verifies
5. **Use realistic scenarios** - Test cases should reflect real user workflows

### Example PR Checklist

- [ ] Added test for new feature/fix
- [ ] Test covers error scenarios
- [ ] Test works on all supported platforms
- [ ] Updated documentation if needed
- [ ] All existing tests still pass

## Troubleshooting

### "Cannot find module" errors
Usually means missing mock setup:
```bash
# Install test dependencies
yarn install
```

### "Mock not working" issues
Check mock setup order:
```typescript
// Mocks should be set up before imports
vi.mock('fs-extra')
import fs from 'fs-extra' // This will use the mock
```

### Timeout issues in CI
Increase timeouts for slow CI environments:
```typescript  
it('should handle slow operations', () => {
  // Test implementation
}, 10000) // 10 second timeout
```

For more help, see the [Cypress Contributing Guide](../../CONTRIBUTING.md).