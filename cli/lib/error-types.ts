/**
 * Discriminated union types for Cypress CLI errors
 * 
 * This file provides type safety for error handling in the CLI,
 * ensuring consistent error structure and eliminating the need
 * for any types in error-related code.
 */

// Base interface that all CLI errors must implement
interface BaseCypressCliError {
  description: string
  solution: string | ((msg?: string, prevMessage?: string) => string)
  code?: string
  exitCode?: number
  footer?: string
}

// Binary and Installation Errors
export interface BinaryNotFoundError extends BaseCypressCliError {
  type: 'BINARY_NOT_FOUND'
  code: 'E_BINARY_MISSING'
  binaryDir: string
}

export interface BinaryNotExecutableError extends BaseCypressCliError {
  type: 'BINARY_NOT_EXECUTABLE' 
  code: 'E_BINARY_PERMISSIONS'
  executable: string
}

export interface NotInstalledCIError extends BaseCypressCliError {
  type: 'NOT_INSTALLED_CI'
  code: 'E_CI_MISSING_BINARY'
  executable: string
}

// Verification Errors
export interface VerifyFailedError extends BaseCypressCliError {
  type: 'VERIFY_FAILED'
  code: 'E_VERIFY_FAILED'
  smokeTestCommand?: string
  timedOut?: boolean
}

export interface SmokeTestDisplayError extends BaseCypressCliError {
  type: 'SMOKE_TEST_DISPLAY_ERROR'
  code: 'INVALID_SMOKE_TEST_DISPLAY_ERROR'
  message?: string
}

export interface VersionMismatchError extends BaseCypressCliError {
  type: 'VERSION_MISMATCH'
  code: 'E_VERSION_MISMATCH'
}

// Configuration Errors
export interface ConfigParseError extends BaseCypressCliError {
  type: 'CONFIG_PARSE'
  code: 'E_CONFIG_PARSE'
  file?: string
}

export interface InvalidConfigFileError extends BaseCypressCliError {
  type: 'INVALID_CONFIG_FILE'
  code: 'E_INVALID_CONFIG_FILE'
}

export interface InvalidTestingTypeError extends BaseCypressCliError {
  type: 'INVALID_TESTING_TYPE'
  code: 'E_INVALID_TESTING_TYPE'
}

// Runtime Errors
export interface ChildProcessKilledError extends BaseCypressCliError {
  type: 'CHILD_PROCESS_KILLED'
  code: 'E_CHILD_KILLED'
  eventName: string
  signal: string
}

export interface InvalidCypressEnvError extends BaseCypressCliError {
  type: 'INVALID_CYPRESS_ENV'
  code: 'E_INVALID_ENV'
  exitCode: 11
}

// System Dependency Errors
export interface MissingXvfbError extends BaseCypressCliError {
  type: 'MISSING_XVFB'
  code: 'E_MISSING_XVFB'
}

export interface MissingDependencyError extends BaseCypressCliError {
  type: 'MISSING_DEPENDENCY'
  code: 'E_MISSING_DEPENDENCY'
}

export interface NonZeroExitCodeXvfbError extends BaseCypressCliError {
  type: 'XVFB_EXIT_ERROR'
  code: 'E_XVFB_EXIT'
}

// Download and Installation Errors
export interface FailedDownloadError extends BaseCypressCliError {
  type: 'FAILED_DOWNLOAD'
  code: 'E_DOWNLOAD_FAILED'
}

export interface FailedUnzipError extends BaseCypressCliError {
  type: 'FAILED_UNZIP'
  code: 'E_UNZIP_FAILED'
}

export interface FailedUnzipWindowsMaxPathError extends BaseCypressCliError {
  type: 'FAILED_UNZIP_MAX_PATH'
  code: 'E_WIN_MAX_PATH'
}

export interface InvalidOSError extends BaseCypressCliError {
  type: 'INVALID_OS'
  code: 'E_INVALID_OS'
}

export interface InvalidCacheDirectoryError extends BaseCypressCliError {
  type: 'INVALID_CACHE_DIRECTORY'
  code: 'E_CACHE_PERMISSIONS'
}

// CLI Argument Errors
export interface IncompatibleHeadlessFlagsError extends BaseCypressCliError {
  type: 'INCOMPATIBLE_HEADLESS_FLAGS'
  code: 'E_INCOMPATIBLE_FLAGS'
}

export interface IncompatibleTestTypeFlagsError extends BaseCypressCliError {
  type: 'INCOMPATIBLE_TEST_TYPE_FLAGS'
  code: 'E_INCOMPATIBLE_TEST_FLAGS'
}

export interface IncompatibleTestingTypeAndFlagError extends BaseCypressCliError {
  type: 'INCOMPATIBLE_TESTING_TYPE_AND_FLAG'
  code: 'E_INCOMPATIBLE_TYPE_FLAG'
}

export interface InvalidRunProjectPathError extends BaseCypressCliError {
  type: 'INVALID_RUN_PROJECT_PATH'
  code: 'E_INVALID_PROJECT_PATH'
}

export interface CypressRunBinaryError extends BaseCypressCliError {
  type: 'CYPRESS_RUN_BINARY_ERROR'
  code: 'E_RUN_BINARY_INVALID'
  value: string
}

// Generic/Unknown Errors
export interface UnknownError extends BaseCypressCliError {
  type: 'UNKNOWN'
  code: 'E_UNKNOWN'
}

export interface UnexpectedError extends BaseCypressCliError {
  type: 'UNEXPECTED'
  code: 'E_UNEXPECTED'
}

// Union type of all possible CLI errors
export type CypressCliError =
  | BinaryNotFoundError
  | BinaryNotExecutableError
  | NotInstalledCIError
  | VerifyFailedError
  | SmokeTestDisplayError
  | VersionMismatchError
  | ConfigParseError
  | InvalidConfigFileError
  | InvalidTestingTypeError
  | ChildProcessKilledError
  | InvalidCypressEnvError
  | MissingXvfbError
  | MissingDependencyError
  | NonZeroExitCodeXvfbError
  | FailedDownloadError
  | FailedUnzipError
  | FailedUnzipWindowsMaxPathError
  | InvalidOSError
  | InvalidCacheDirectoryError
  | IncompatibleHeadlessFlagsError
  | IncompatibleTestTypeFlagsError
  | IncompatibleTestingTypeAndFlagError
  | InvalidRunProjectPathError
  | CypressRunBinaryError
  | UnknownError
  | UnexpectedError

// Type guards for error discrimination
export function isBinaryError(error: CypressCliError): error is BinaryNotFoundError | BinaryNotExecutableError | NotInstalledCIError {
  return error.type === 'BINARY_NOT_FOUND' || error.type === 'BINARY_NOT_EXECUTABLE' || error.type === 'NOT_INSTALLED_CI'
}

export function isVerificationError(error: CypressCliError): error is VerifyFailedError | SmokeTestDisplayError | VersionMismatchError {
  return error.type === 'VERIFY_FAILED' || error.type === 'SMOKE_TEST_DISPLAY_ERROR' || error.type === 'VERSION_MISMATCH'
}

export function isConfigurationError(error: CypressCliError): error is ConfigParseError | InvalidConfigFileError | InvalidTestingTypeError {
  return error.type === 'CONFIG_PARSE' || error.type === 'INVALID_CONFIG_FILE' || error.type === 'INVALID_TESTING_TYPE'
}

export function isSystemError(error: CypressCliError): error is MissingXvfbError | MissingDependencyError | NonZeroExitCodeXvfbError {
  return error.type === 'MISSING_XVFB' || error.type === 'MISSING_DEPENDENCY' || error.type === 'XVFB_EXIT_ERROR'
}

// Helper function to create typed errors
export function createTypedError<T extends CypressCliError>(errorData: T): T {
  return errorData
}

// Factory functions for common error patterns
export const ErrorFactories = {
  binaryNotFound: (binaryDir: string): BinaryNotFoundError => 
    createTypedError({
      type: 'BINARY_NOT_FOUND',
      code: 'E_BINARY_MISSING',
      binaryDir,
      description: `No version of Cypress is installed in: ${binaryDir}`,
      solution: 'Please reinstall Cypress by running: cypress install',
    }),

  childProcessKilled: (eventName: string, signal: string): ChildProcessKilledError =>
    createTypedError({
      type: 'CHILD_PROCESS_KILLED',
      code: 'E_CHILD_KILLED',
      eventName,
      signal,
      description: `The Test Runner unexpectedly exited via a ${eventName} event with signal ${signal}`,
      solution: 'Please search Cypress documentation for possible solutions or open a GitHub issue.',
    }),

  smokeTestFailure: (smokeTestCommand: string, timedOut: boolean): VerifyFailedError =>
    createTypedError({
      type: 'VERIFY_FAILED',
      code: 'E_VERIFY_FAILED',
      smokeTestCommand,
      timedOut,
      description: `Cypress verification ${timedOut ? 'timed out' : 'failed'}.`,
      solution: `This command failed with the following output:\n\n${smokeTestCommand}`,
    }),
}

/**
 * Helper function to normalize unknown errors into typed CypressCliError
 * Useful for catch blocks and error handling where the error type is unknown
 */
export function asCliError(error: unknown, fallbackMessage?: string): CypressCliError {
  // If it's already a CLI error, return as-is
  if (error && typeof error === 'object' && 'type' in error && 'code' in error) {
    return error as CypressCliError
  }
  
  // If it's an Error object, use its message
  if (error instanceof Error) {
    return createTypedError({
      type: 'UNEXPECTED',
      code: 'E_UNEXPECTED',
      description: error.message || fallbackMessage || 'An unexpected error occurred',
      solution: 'Please search Cypress documentation for possible solutions or open a GitHub issue.',
    })
  }
  
  // For any other type, stringify it
  return createTypedError({
    type: 'UNKNOWN',
    code: 'E_UNKNOWN',
    description: fallbackMessage || (typeof error === 'string' ? error : 'An unknown error occurred'),
    solution: 'Please search Cypress documentation for possible solutions or open a GitHub issue.',
  })
}

/**
 * Backward compatibility: Convert plain error objects to typed CLI errors
 * Useful during the transition period from any types to discriminated unions
 */
export function normalizeError(error: any): CypressCliError {
  // If it's already a proper CLI error with type and code, return as-is
  if (error && typeof error === 'object' && error.type && error.code) {
    return error as CypressCliError
  }
  
  // If it's a plain object with description/solution, convert to UnexpectedError
  if (error && typeof error === 'object' && error.description && error.solution) {
    return createTypedError({
      type: 'UNEXPECTED',
      code: 'E_UNEXPECTED',
      description: error.description,
      solution: error.solution,
      exitCode: error.exitCode,
      footer: error.footer,
    })
  }
  
  // Fallback to asCliError for anything else
  return asCliError(error)
}