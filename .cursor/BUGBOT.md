## Overview
Essential rules for reviewing code changes in the Cypress monorepo.

## Critical PR Review Rules

### Security Checklist
- [ ] **Input validation**: All user inputs are validated
- [ ] **Path traversal**: File paths are safely resolved
- [ ] **Sensitive data**: No secrets or sensitive info in logs
- [ ] **Network requests**: URLs are validated before requests
- [ ] **File permissions**: Proper permission handling for file operations

### Performance Checklist
- [ ] **Startup time**: No blocking operations during startup
- [ ] **Memory usage**: Resources are properly disposed
- [ ] **Bundle size**: No unnecessary dependencies added
- [ ] **Async operations**: Non-blocking where possible
- [ ] **Caching**: Appropriate caching strategies used

### Cypress-Specific Rules
- [ ] **Browser compatibility**: Test on Chrome, Firefox, Edge, Safari
- [ ] **Network stubbing**: Proper request/response mocking
- [ ] **DOM manipulation**: Safe element selection and manipulation
- [ ] **Test isolation**: Tests don't interfere with each other
- [ ] **Command chaining**: Proper use of Cypress command chaining
- [ ] **Assertions**: Meaningful assertions with clear failure messages
- [ ] **Timeouts**: Appropriate timeout values for different operations
- [ ] **Retry logic**: Proper retry strategies for flaky operations

### Code Quality Rules
- [ ] **Naming**: Variables and functions have descriptive names
- [ ] **Comments**: Complex logic is explained with comments
- [ ] **Imports**: Imports are organized and minimal
- [ ] **Exports**: Only necessary functions/classes are exported
- [ ] **Side effects**: Functions are pure when possible
- [ ] **Error boundaries**: Proper error boundaries in React components
- [ ] **Magic numbers and Regex**: Extract to named constants

### Testing Rules
- [ ] **Test naming**: Tests describe the behavior being tested
- [ ] **Test isolation**: Each test is independent
- [ ] **Mocking**: External dependencies are properly mocked
- [ ] **Coverage**: Critical paths have test coverage
- [ ] **Edge cases**: Error conditions and edge cases are tested
- [ ] **Performance**: Tests don't take too long to run
- [ ] **Flakiness**: Tests are deterministic and not flaky
- [ ] **Setup/teardown**: Proper test setup and cleanup

## Package-Specific Priorities

### Critical Packages (Highest Priority)
- **@packages/server**: The heart of Cypress - changes affect everything
  - Focus: Async operations, file system security, proxy logic, performance, cross-platform compatibility
- **@packages/driver**: Runs in browser context - security and compatibility crucial
  - Focus: Browser compatibility, DOM safety, network stubbing, test commands, memory management
- **cli**: Main command-line interface - user-facing entry point
  - Focus: Command-line argument parsing, user experience, error handling, cross-platform compatibility

### User-Facing Packages (High Priority)
- **@packages/app**: Main desktop application
  - Focus: UI/UX, Vue component logic, accessibility, state management, performance
- **@packages/launchpad**: Project setup UI
  - Focus: User experience, GraphQL integration, onboarding flow, project scaffolding
- **@packages/runner**: Test runner interface
  - Focus: React component logic, UI state management, test execution display

### Published Packages (High Priority)
- **@cypress/* packages**: Published to npm - breaking changes critical
  - Focus: Backward compatibility, documentation, comprehensive testing, API stability
- **@cypress/vue**: Vue component testing support
  - Focus: Vue integration, component testing logic, Vue 3 compatibility
- **@cypress/react**: React component testing support
  - Focus: React integration, component testing logic, React version compatibility
- **@cypress/angular**: Angular component testing support
  - Focus: Angular integration, component testing logic, Angular CLI integration
- **@cypress/vite-dev-server**: Vite development server integration
  - Focus: Vite integration, dev server configuration, ESM compatibility

### Core Infrastructure (High Priority)
- **@packages/config**: Configuration management
  - Focus: Configuration schema changes, validation logic, backward compatibility
- **@packages/errors**: Error handling
  - Focus: Error message clarity, error handling patterns, user-friendly messages
- **@packages/types**: TypeScript definitions
  - Focus: Type safety, API compatibility, public interface definitions
- **@packages/network**: Network utilities
  - Focus: Network security, request/response handling, HTTP client utilities
- **@packages/proxy**: Proxy management
  - Focus: Proxy security, traffic handling, request interception
- **@packages/net-stubbing**: Network stubbing
  - Focus: Stubbing logic, network simulation accuracy, request mocking
- **@packages/https-proxy**: HTTPS proxy functionality
  - Focus: HTTPS security, certificate management, SSL/TLS handling

### Browser & Platform (High Priority)
- **@packages/launcher**: Browser management
  - Focus: Cross-platform compatibility, browser binary handling, process management
- **@packages/electron**: Electron integration
  - Focus: Electron API usage, binary packaging, cross-platform builds, app distribution
- **@packages/extension**: Browser extension
  - Focus: Extension API usage, browser compatibility, communication protocols

### Data & State Management (Medium Priority)
- **@packages/data-context**: Data management
  - Focus: State management patterns, data consistency, application state
- **@packages/graphql**: GraphQL layer
  - Focus: GraphQL schema changes, resolver logic, API schema definition
- **@packages/socket**: WebSocket communication
  - Focus: Socket security, message handling, real-time communication

### Code Processing (Medium Priority)
- **@packages/rewriter**: Code rewriting
  - Focus: Code transformation logic, source map accuracy, JavaScript instrumentation
- **@packages/v8-snapshot-require**: V8 snapshot support
  - Focus: Snapshot compatibility, performance impact, Electron integration
- **@packages/packherd-require**: Dependency packing
  - Focus: Bundle optimization, dependency management, module resolution

### UI & Frontend (Medium Priority)
- **@packages/frontend-shared**: Shared frontend utilities
  - Focus: Component reusability, utility functions, shared UI components
- **@packages/icons**: Icon assets
  - Focus: Asset organization, icon consistency, visual design
- **@packages/reporter**: Test reporting
  - Focus: Report accuracy, formatting logic, test result display

### Development & Build (Medium Priority)
- **@packages/ts**: TypeScript configuration
  - Focus: TypeScript configuration, compilation setup, type checking
- **@packages/web-config**: Web configuration
  - Focus: Configuration logic, build setup, web app configuration
- **@packages/scaffold-config**: Project scaffolding
  - Focus: Scaffolding logic, template accuracy, project initialization

### Utility Packages (Lower Priority)
- **@packages/root**: Root package (dummy package)
  - Focus: Monorepo setup, package coordination
- **@packages/example**: Example project
  - Focus: Example accuracy, documentation quality, test examples
- **@packages/resolve-dist**: Path resolution
  - Focus: Asset resolution, path handling, build artifact management

### Tooling Packages (Lower Priority)
- **@tooling/electron-mksnapshot**: Electron snapshot tool
  - Focus: Snapshot generation logic, Electron integration, performance optimization
- **@tooling/packherd**: Dependency packing tool
  - Focus: Bundle optimization, dependency resolution, module bundling
- **@tooling/v8-snapshot**: V8 snapshot tooling
  - Focus: Snapshot management, performance optimization, V8 integration

