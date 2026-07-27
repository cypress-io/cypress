/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: string;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
}

export type AuthStateNameEnum =
  | 'AUTH_BROWSER_LAUNCHED'
  | 'AUTH_COULD_NOT_LAUNCH_BROWSER'
  | 'AUTH_ERROR_DURING_LOGIN';

export type BrowserFamily =
  | 'chromium'
  | 'firefox'
  | 'webkit';

export type BrowserStatus =
  | 'closed'
  | 'open'
  | 'opening';

export type CloudAppMessageCtaStyle =
  | 'primary'
  | 'secondary';

export type CloudAppMessageDismissalScope =
  | 'project'
  | 'user';

export type CloudAppMessageVisualStyle =
  | 'info'
  | 'warning';

/** Possible check status of a run group */
export type CloudRunGroupStatusEnum =
  | 'CANCELLED'
  | 'ERRORED'
  | 'FAILED'
  | 'NOTESTS'
  | 'PASSED'
  | 'RUNNING'
  | 'TIMEDOUT'
  | 'UNCLAIMED';

/** Possible check status of the test run */
export type CloudRunStatus =
  | 'CANCELLED'
  | 'ERRORED'
  | 'FAILED'
  | 'NOTESTS'
  | 'OVERLIMIT'
  | 'PASSED'
  | 'RUNNING'
  | 'TIMEDOUT';

/** Possible check status of the spec within a run */
export type CloudSpecStatus =
  | 'CANCELLED'
  | 'ERRORED'
  | 'FAILED'
  | 'NOTESTS'
  | 'PASSED'
  | 'RUNNING'
  | 'TIMEDOUT'
  | 'UNCLAIMED';

/** State of the test result */
export type CloudTestResultStateEnum =
  | 'CANCELLED'
  | 'ERRORED'
  | 'FAILED'
  | 'PASSED'
  | 'PENDING'
  | 'RUNNING'
  | 'SKIPPED'
  | 'TIMEDOUT'
  | 'UNKNOWN';

/** Type of tests */
export type CloudTestingTypeEnum =
  | 'COMPONENT'
  | 'E2E';

export type CodeGenType =
  | 'component'
  | 'componentEmpty'
  | 'e2e'
  | 'e2eExamples';

export type CodeLanguageEnum =
  | 'js'
  | 'ts';

export interface CohortInput {
  /** Array of cohort options to choose from.  Ex: A or B  */
  readonly cohorts: ReadonlyArray<Scalars['String']>;
  /** Name of the cohort */
  readonly name: Scalars['String'];
  /** Optional array of integer weights to use for determining cohort. Defaults to even weighting */
  readonly weights: InputMaybe<ReadonlyArray<Scalars['Int']>>;
}

export type DevRelaunchAction =
  | 'dismiss'
  | 'trigger';

export type ErrorTypeEnum =
  | 'AUTOMATION_SERVER_DISCONNECTED'
  | 'BAD_POLICY_WARNING'
  | 'BROWSER_CRASHED'
  | 'BROWSER_NOT_FOUND_BY_NAME'
  | 'BROWSER_NOT_FOUND_BY_PATH'
  | 'BROWSER_PAGE_CLOSED_UNEXPECTEDLY'
  | 'BROWSER_PROCESS_CLOSED_UNEXPECTEDLY'
  | 'BROWSER_UNSUPPORTED_LAUNCH_OPTION'
  | 'BUNDLE_ERROR'
  | 'CANNOT_CONNECT_BASE_URL'
  | 'CANNOT_CONNECT_BASE_URL_RETRYING'
  | 'CANNOT_CONNECT_BASE_URL_WARNING'
  | 'CANNOT_ENABLE_FEATURE_WITH_NO_TESTS'
  | 'CANNOT_RECORD_NO_PROJECT_ID'
  | 'CANNOT_REMOVE_OLD_BROWSER_PROFILES'
  | 'CANNOT_TRASH_ASSETS'
  | 'CDP_COULD_NOT_CONNECT'
  | 'CDP_COULD_NOT_RECONNECT'
  | 'CDP_RETRYING_CONNECTION'
  | 'CHROME_137_LOAD_EXTENSION_NOT_SUPPORTED'
  | 'CHROME_WEB_SECURITY_NOT_SUPPORTED'
  | 'CLOUD_ALREADY_COMPLETE'
  | 'CLOUD_API_RESPONSE_FAILED_RETRYING'
  | 'CLOUD_AUTO_CANCEL_MISMATCH'
  | 'CLOUD_AUTO_CANCEL_NOT_AVAILABLE_IN_PLAN'
  | 'CLOUD_CANCEL_SKIPPED_SPEC'
  | 'CLOUD_CANNOT_CONFIRM_ARTIFACTS'
  | 'CLOUD_CANNOT_CREATE_RUN_OR_INSTANCE'
  | 'CLOUD_CANNOT_PROCEED_IN_PARALLEL'
  | 'CLOUD_CANNOT_PROCEED_IN_PARALLEL_NETWORK'
  | 'CLOUD_CANNOT_PROCEED_IN_SERIAL'
  | 'CLOUD_CANNOT_PROCEED_IN_SERIAL_NETWORK'
  | 'CLOUD_CANNOT_UPLOAD_ARTIFACTS'
  | 'CLOUD_GRAPHQL_ERROR'
  | 'CLOUD_INVALID_RUN_REQUEST'
  | 'CLOUD_PARALLEL_DISALLOWED'
  | 'CLOUD_PARALLEL_GROUP_PARAMS_MISMATCH'
  | 'CLOUD_PARALLEL_REQUIRED'
  | 'CLOUD_PROJECT_NOT_FOUND'
  | 'CLOUD_PROTOCOL_CANNOT_UPLOAD_ARTIFACT'
  | 'CLOUD_PROTOCOL_CAPTURE_FAILURE'
  | 'CLOUD_PROTOCOL_INITIALIZATION_FAILURE'
  | 'CLOUD_PROTOCOL_UPLOAD_AGGREGATE_ERROR'
  | 'CLOUD_PROTOCOL_UPLOAD_HTTP_FAILURE'
  | 'CLOUD_PROTOCOL_UPLOAD_NETWORK_FAILURE'
  | 'CLOUD_PROTOCOL_UPLOAD_STREAM_STALL_FAILURE'
  | 'CLOUD_PROTOCOL_UPLOAD_UNKNOWN_ERROR'
  | 'CLOUD_RECORD_KEY_NOT_VALID'
  | 'CLOUD_RUN_GROUP_NAME_NOT_UNIQUE'
  | 'CLOUD_STALE_RUN'
  | 'CLOUD_UNKNOWN_CREATE_RUN_WARNING'
  | 'CLOUD_UNKNOWN_INVALID_REQUEST'
  | 'COMPONENT_TESTING_MISMATCHED_DEPENDENCIES'
  | 'CONFIG_BROWSERS_INVALID'
  | 'CONFIG_FILES_LANGUAGE_CONFLICT'
  | 'CONFIG_FILE_DEV_SERVER_INVALID_RETURN'
  | 'CONFIG_FILE_DEV_SERVER_IS_NOT_VALID'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG_COMPONENT'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E'
  | 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT'
  | 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_E2E'
  | 'CONFIG_FILE_NOT_FOUND'
  | 'CONFIG_FILE_REQUIRE_ERROR'
  | 'CONFIG_FILE_SETUP_NODE_EVENTS_ERROR'
  | 'CONFIG_FILE_UNEXPECTED_ERROR'
  | 'CONFIG_VALIDATION_ERROR'
  | 'CONFIG_VALIDATION_MSG_ERROR'
  | 'COULD_NOT_PARSE_ARGUMENTS'
  | 'CYPRESS_ENV_DEPRECATION'
  | 'DEFAULT_SUPPORT_FILE_NOT_FOUND'
  | 'DEV_SERVER_CONFIG_FILE_NOT_FOUND'
  | 'DUPLICATE_TASK_KEY'
  | 'ERROR_READING_FILE'
  | 'ERROR_WRITING_FILE'
  | 'EXPERIMENTAL_JIT_COMPILE_REMOVED'
  | 'EXPERIMENTAL_ORIGIN_DEPENDENCIES_E2E_ONLY'
  | 'EXPERIMENTAL_PROMPT_COMMAND_REMOVED'
  | 'EXPERIMENTAL_SESSION_AND_ORIGIN_REMOVED'
  | 'EXPERIMENTAL_SINGLE_TAB_RUN_MODE'
  | 'EXPERIMENTAL_SKIP_DOMAIN_INJECTION_REMOVED'
  | 'EXPERIMENTAL_STUDIO_REMOVED'
  | 'EXTENSION_NOT_LOADED'
  | 'FILE_SERVER_COULD_NOT_LISTEN'
  | 'FIREFOX_COULD_NOT_CONNECT'
  | 'FIXTURE_NOT_FOUND'
  | 'FOLDER_NOT_WRITABLE'
  | 'FREE_PLAN_EXCEEDS_MONTHLY_TESTS'
  | 'FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS'
  | 'FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE'
  | 'INCORRECT_CI_BUILD_ID_USAGE'
  | 'INDETERMINATE_CI_BUILD_ID'
  | 'INJECT_DOCUMENT_DOMAIN_DEPRECATION'
  | 'INJECT_DOCUMENT_DOMAIN_E2E_ONLY'
  | 'INVALID_CONFIG_OPTION'
  | 'INVALID_CYPRESS_ENV_OVERRIDE'
  | 'INVALID_CYPRESS_INTERNAL_ENV'
  | 'INVALID_REPORTER_NAME'
  | 'INVOKED_BINARY_OUTSIDE_NPM_MODULE'
  | 'JIT_COMPONENT_TESTING'
  | 'MULTIPLE_SUPPORT_FILES_FOUND'
  | 'NO_DEFAULT_CONFIG_FILE_FOUND'
  | 'NO_PROJECT_FOUND_AT_PROJECT_ROOT'
  | 'NO_PROJECT_ID'
  | 'NO_SPECS_FOUND'
  | 'PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN'
  | 'PLAN_EXCEEDS_MONTHLY_TESTS'
  | 'PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED'
  | 'PLUGINS_RUN_EVENT_ERROR'
  | 'PORT_IN_USE_SHORT'
  | 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION'
  | 'PROXY_ENCOUNTERED_INVALID_HEADER_NAME'
  | 'PROXY_ENCOUNTERED_INVALID_HEADER_VALUE'
  | 'RECORDING_FROM_FORK_PR'
  | 'RECORD_KEY_MISSING'
  | 'RECORD_PARAMS_WITHOUT_RECORDING'
  | 'RENAMED_CONFIG_OPTION'
  | 'RENDERER_CRASHED'
  | 'RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN'
  | 'SETUP_NODE_EVENTS_INVALID_EVENT_NAME_ERROR'
  | 'SETUP_NODE_EVENTS_IS_NOT_FUNCTION'
  | 'SPEC_FILE_NOT_FOUND'
  | 'SUPPORT_FILE_NOT_FOUND'
  | 'SYNCHRONOUS_XHR_REQUEST_COOKIES_NOT_APPLIED'
  | 'SYNCHRONOUS_XHR_REQUEST_COOKIES_NOT_SET'
  | 'SYNCHRONOUS_XHR_REQUEST_NOT_INTERCEPTED'
  | 'TESTING_TYPE_NOT_CONFIGURED'
  | 'TESTS_DID_NOT_START_FAILED'
  | 'TESTS_DID_NOT_START_RETRYING'
  | 'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES'
  | 'UNEXPECTED_INTERNAL_ERROR'
  | 'UNEXPECTED_MUTATION_ERROR'
  | 'UNSUPPORTED_BROWSER_VERSION'
  | 'VIDEO_CAPTURE_FAILED'
  | 'VIDEO_COMPRESSION_FAILED'
  | 'VIDEO_RECORDING_FAILED'
  | 'VIDEO_UPLOAD_ON_PASSES_REMOVED';

export interface FileDetailsInput {
  readonly column: InputMaybe<Scalars['Int']>;
  /** When we open a file we take a filePath, either relative to the project root, or absolute on disk */
  readonly filePath: Scalars['String'];
  readonly line: InputMaybe<Scalars['Int']>;
}

export type FileExtensionEnum =
  | 'js'
  | 'jsx'
  | 'ts'
  | 'tsx';

export type GitInfoStatusType =
  | 'created'
  | 'modified'
  | 'noGitInfo'
  | 'unmodified';

/** Counts for specs and tests from a local project at a point in time */
export interface LocalTestCountsInput {
  /** Current Git branch name for local project */
  readonly branch: InputMaybe<Scalars['String']>;
  /** Total number of example specs found in project */
  readonly exampleSpecs: Scalars['Int'];
  /** Total number of tests found in example specs. This can be an estimate */
  readonly exampleTests: Scalars['Int'];
  /** Project slug for project */
  readonly projectSlug: InputMaybe<Scalars['String']>;
  /** Testing type */
  readonly testingType: CloudTestingTypeEnum;
  /** Total number of specs found in project */
  readonly totalSpecs: Scalars['Int'];
  /** Total number of tests found in all specs in project. This can be an estimate */
  readonly totalTests: Scalars['Int'];
}

/** Possible operating systems for a build */
export type OperatingSystemsEnum =
  | 'LINUX'
  | 'MAC'
  | 'UNKNOWN'
  | 'WINDOWS';

/** What to do when the run is over the limit */
export type OverLimitActionTypeEnum =
  | 'CONTACT_ADMIN'
  | 'UPGRADE';

export type PackageManagerEnum =
  | 'bun'
  | 'npm'
  | 'pnpm'
  | 'yarn';

export type PluginsState =
  | 'error'
  | 'initialized'
  | 'initializing'
  | 'uninitialized';

export type PreferencesTypeEnum =
  | 'global'
  | 'project';

export type RelevantRunLocationEnum =
  | 'DEBUG'
  | 'RUNS'
  | 'SIDEBAR'
  | 'SPECS';

export type RemoteFetchableStatus =
  /** Errored while fetching */
  | 'ERRORED'
  /** We have loaded the remote data */
  | 'FETCHED'
  /** Currently fetching */
  | 'FETCHING'
  /** Has not been fetched yet */
  | 'NOT_FETCHED';

/** Possible check status of the instances run */
export type RunInstanceStatusEnum =
  | 'CANCELLED'
  | 'ERRORED'
  | 'FAILED'
  | 'NOTESTS'
  | 'PASSED'
  | 'RUNNING'
  | 'TIMEDOUT'
  | 'UNCLAIMED';

export type RunSpecErrorCode =
  | 'GENERAL_ERROR'
  | 'NO_PROJECT'
  | 'NO_SPEC_PATH'
  | 'NO_SPEC_PATTERN_MATCH'
  | 'SPEC_NOT_FOUND'
  | 'TESTING_TYPE_NOT_CONFIGURED';

export type SpecType =
  | 'component'
  | 'integration';

export type StudioStatusType =
  | 'ENABLED'
  | 'INITIALIZING'
  | 'IN_ERROR'
  | 'NOT_INITIALIZED';

export type SupportStatusEnum =
  | 'alpha'
  | 'beta'
  | 'community'
  | 'full';

/** The bundlers that we can use with Cypress */
export type SupportedBundlers =
  | 'vite'
  | 'webpack';

export type TestingTypeEnum =
  | 'component'
  | 'e2e';

/** Represents the input for setting a mapping of test titles by the spec path */
export interface TestsBySpecInput {
  /** Path to the spec relative to the project */
  readonly specPath: Scalars['String'];
  /** Full test title which should be all parts joined by a space */
  readonly tests: ReadonlyArray<Scalars['String']>;
}

export type WizardConfigFileStatusEnum =
  | 'changes'
  | 'error'
  | 'skipped'
  | 'valid';

export interface WizardUpdateInput {
  readonly bundler: InputMaybe<SupportedBundlers>;
  readonly framework: InputMaybe<Scalars['String']>;
}

export type TapSpecsQueryVariables = Exact<{ [key: string]: never; }>;


export type TapSpecsQuery = { readonly __typename?: 'Query', readonly currentProject: { readonly __typename?: 'CurrentProject', readonly specs: ReadonlyArray<{ readonly __typename?: 'Spec', readonly relative: string, readonly gitInfo: { readonly __typename?: 'GitInfo', readonly lastModifiedHumanReadable: string | null, readonly lastModifiedTimestamp: string | null } | null }> } | null };

export type TapRunSpecMutationVariables = Exact<{
  specPath: Scalars['String'];
}>;


export type TapRunSpecMutation = { readonly __typename?: 'Mutation', readonly runSpec: { readonly __typename: 'RunSpecError', readonly code: RunSpecErrorCode, readonly detailMessage: string | null } | { readonly __typename: 'RunSpecResponse', readonly testingType: string, readonly browser: { readonly __typename?: 'Browser', readonly displayName: string }, readonly spec: { readonly __typename?: 'Spec', readonly relative: string } } | null };
