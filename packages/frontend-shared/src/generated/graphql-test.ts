/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  | 'firefox';

export type BrowserStatus =
  | 'closed'
  | 'open'
  | 'opening';

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

export type CodeGenType =
  | 'component'
  | 'e2e'
  | 'scaffoldIntegration'
  | 'story';

export type CodeLanguageEnum =
  | 'js'
  | 'ts';

export type DevRelaunchAction =
  | 'dismiss'
  | 'trigger';

export type ErrorTypeEnum =
  | 'AUTOMATION_SERVER_DISCONNECTED'
  | 'BAD_POLICY_WARNING'
  | 'BAD_POLICY_WARNING_TOOLTIP'
  | 'BROWSER_NOT_FOUND_BY_NAME'
  | 'BROWSER_NOT_FOUND_BY_PATH'
  | 'BUNDLE_ERROR'
  | 'CANNOT_CONNECT_BASE_URL'
  | 'CANNOT_CONNECT_BASE_URL_RETRYING'
  | 'CANNOT_CONNECT_BASE_URL_WARNING'
  | 'CANNOT_CREATE_PROJECT_TOKEN'
  | 'CANNOT_FETCH_PROJECT_TOKEN'
  | 'CANNOT_RECORD_NO_PROJECT_ID'
  | 'CANNOT_REMOVE_OLD_BROWSER_PROFILES'
  | 'CANNOT_TRASH_ASSETS'
  | 'CDP_COULD_NOT_CONNECT'
  | 'CDP_COULD_NOT_RECONNECT'
  | 'CDP_RETRYING_CONNECTION'
  | 'CDP_VERSION_TOO_OLD'
  | 'CHROME_WEB_SECURITY_NOT_SUPPORTED'
  | 'COMPONENT_FOLDER_REMOVED'
  | 'CONFIG_FILES_LANGUAGE_CONFLICT'
  | 'CONFIG_FILE_DEV_SERVER_IS_NOT_A_FUNCTION'
  | 'CONFIG_FILE_INVALID_DEV_START_EVENT'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E'
  | 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT'
  | 'CONFIG_FILE_MIGRATION_NEEDED'
  | 'CONFIG_FILE_NOT_FOUND'
  | 'CONFIG_FILE_REQUIRE_ERROR'
  | 'CONFIG_FILE_SETUP_NODE_EVENTS_ERROR'
  | 'CONFIG_FILE_UNEXPECTED_ERROR'
  | 'CONFIG_VALIDATION_ERROR'
  | 'CONFIG_VALIDATION_MSG_ERROR'
  | 'COULD_NOT_FIND_SYSTEM_NODE'
  | 'COULD_NOT_PARSE_ARGUMENTS'
  | 'DASHBOARD_ALREADY_COMPLETE'
  | 'DASHBOARD_API_RESPONSE_FAILED_RETRYING'
  | 'DASHBOARD_CANCEL_SKIPPED_SPEC'
  | 'DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE'
  | 'DASHBOARD_CANNOT_PROCEED_IN_PARALLEL'
  | 'DASHBOARD_CANNOT_PROCEED_IN_SERIAL'
  | 'DASHBOARD_CANNOT_UPLOAD_RESULTS'
  | 'DASHBOARD_GRAPHQL_ERROR'
  | 'DASHBOARD_INVALID_RUN_REQUEST'
  | 'DASHBOARD_PARALLEL_DISALLOWED'
  | 'DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH'
  | 'DASHBOARD_PARALLEL_REQUIRED'
  | 'DASHBOARD_PROJECT_NOT_FOUND'
  | 'DASHBOARD_RECORD_KEY_NOT_VALID'
  | 'DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE'
  | 'DASHBOARD_STALE_RUN'
  | 'DASHBOARD_UNKNOWN_CREATE_RUN_WARNING'
  | 'DASHBOARD_UNKNOWN_INVALID_REQUEST'
  | 'DEFAULT_SUPPORT_FILE_NOT_FOUND'
  | 'DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS'
  | 'DUPLICATE_TASK_KEY'
  | 'ERROR_READING_FILE'
  | 'ERROR_WRITING_FILE'
  | 'EXPERIMENTAL_COMPONENT_TESTING_REMOVED'
  | 'EXPERIMENTAL_NETWORK_STUBBING_REMOVED'
  | 'EXPERIMENTAL_RUN_EVENTS_REMOVED'
  | 'EXPERIMENTAL_SAMESITE_REMOVED'
  | 'EXPERIMENTAL_SHADOW_DOM_REMOVED'
  | 'EXPERIMENTAL_STUDIO_REMOVED'
  | 'EXTENSION_NOT_LOADED'
  | 'FIREFOX_COULD_NOT_CONNECT'
  | 'FIREFOX_GC_INTERVAL_REMOVED'
  | 'FIREFOX_MARIONETTE_FAILURE'
  | 'FIXTURE_NOT_FOUND'
  | 'FOLDER_NOT_WRITABLE'
  | 'FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS'
  | 'FREE_PLAN_EXCEEDS_MONTHLY_TESTS'
  | 'FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS'
  | 'FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS'
  | 'FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE'
  | 'INCOMPATIBLE_PLUGIN_RETRIES'
  | 'INCORRECT_CI_BUILD_ID_USAGE'
  | 'INDETERMINATE_CI_BUILD_ID'
  | 'INTEGRATION_FOLDER_REMOVED'
  | 'INVALID_CONFIG_OPTION'
  | 'INVALID_CYPRESS_INTERNAL_ENV'
  | 'INVALID_REPORTER_NAME'
  | 'INVOKED_BINARY_OUTSIDE_NPM_MODULE'
  | 'LEGACY_CONFIG_ERROR_DURING_MIGRATION'
  | 'LEGACY_CONFIG_FILE'
  | 'MIGRATION_ALREADY_OCURRED'
  | 'MULTIPLE_SUPPORT_FILES_FOUND'
  | 'NODE_VERSION_DEPRECATION_BUNDLED'
  | 'NODE_VERSION_DEPRECATION_SYSTEM'
  | 'NOT_LOGGED_IN'
  | 'NO_DEFAULT_CONFIG_FILE_FOUND'
  | 'NO_PROJECT_FOUND_AT_PROJECT_ROOT'
  | 'NO_PROJECT_ID'
  | 'NO_SPECS_FOUND'
  | 'PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS'
  | 'PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN'
  | 'PLAN_EXCEEDS_MONTHLY_TESTS'
  | 'PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED'
  | 'PLUGINS_FILE_CONFIG_OPTION_REMOVED'
  | 'PLUGINS_RUN_EVENT_ERROR'
  | 'PORT_IN_USE_LONG'
  | 'PORT_IN_USE_SHORT'
  | 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION'
  | 'RECORDING_FROM_FORK_PR'
  | 'RECORD_KEY_MISSING'
  | 'RECORD_PARAMS_WITHOUT_RECORDING'
  | 'RENAMED_CONFIG_OPTION'
  | 'RENDERER_CRASHED'
  | 'RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN'
  | 'SETUP_NODE_EVENTS_DO_NOT_SUPPORT_DEV_SERVER'
  | 'SETUP_NODE_EVENTS_INVALID_EVENT_NAME_ERROR'
  | 'SETUP_NODE_EVENTS_IS_NOT_FUNCTION'
  | 'SUPPORT_FILE_NOT_FOUND'
  | 'TESTS_DID_NOT_START_FAILED'
  | 'TESTS_DID_NOT_START_RETRYING'
  | 'TEST_FILES_RENAMED'
  | 'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES'
  | 'UNEXPECTED_INTERNAL_ERROR'
  | 'UNEXPECTED_MUTATION_ERROR'
  | 'UNSUPPORTED_BROWSER_VERSION'
  | 'VIDEO_POST_PROCESSING_FAILED'
  | 'VIDEO_RECORDING_FAILED';

export interface FileDetailsInput {
  readonly column: InputMaybe<Scalars['Int']>;
  /** When we open a file we take a filePath, either relative to the project root, or absolute on disk */
  readonly filePath: Scalars['String'];
  readonly line: InputMaybe<Scalars['Int']>;
}

export type FileExtensionEnum =
  | 'js'
  | 'ts';

export type FrontendFrameworkCategoryEnum =
  | 'react'
  | 'vue';

export type FrontendFrameworkEnum =
  | 'crav4'
  | 'crav5'
  | 'nextjs'
  | 'nuxtjs'
  | 'react'
  | 'vue2'
  | 'vue3'
  | 'vuecli4vue2'
  | 'vuecli4vue3'
  | 'vuecli5vue2'
  | 'vuecli5vue3';

export type GitInfoStatusType =
  | 'created'
  | 'modified'
  | 'unmodified';

export type MigrationStepEnum =
  | 'configFile'
  | 'renameAuto'
  | 'renameManual'
  | 'renameSupport'
  | 'setupComponent';

export type PackageManagerEnum =
  | 'npm'
  | 'pnpm'
  | 'yarn';

export type PluginsState =
  | 'error'
  | 'initialized'
  | 'initializing'
  | 'uninitialized';

export type SpecType =
  | 'component'
  | 'integration';

/** The bundlers that we can use with Cypress */
export type SupportedBundlers =
  | 'vite'
  | 'webpack4'
  | 'webpack5';

/** The packages for bundlers that we can use with Cypress */
export type SupportedPackage =
  | 'vite'
  | 'webpack';

export type TestingTypeEnum =
  | 'component'
  | 'e2e';

export type WizardConfigFileStatusEnum =
  | 'changes'
  | 'error'
  | 'skipped'
  | 'valid';

export interface WizardUpdateInput {
  readonly bundler: InputMaybe<SupportedBundlers>;
  readonly codeLanguage: InputMaybe<CodeLanguageEnum>;
  readonly framework: InputMaybe<FrontendFrameworkEnum>;
}

export type AuthFragment = { __typename?: 'Query', cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null, authState: { __typename?: 'AuthState', browserOpened: boolean, name: AuthStateNameEnum | null, message: string | null } };

export type Auth_LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type Auth_LogoutMutation = { __typename?: 'Mutation', logout: { __typename?: 'Query', cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null, authState: { __typename?: 'AuthState', browserOpened: boolean, name: AuthStateNameEnum | null, message: string | null } } | null };

export type Auth_LoginMutationVariables = Exact<{ [key: string]: never; }>;


export type Auth_LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'Query', cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null, authState: { __typename?: 'AuthState', browserOpened: boolean, name: AuthStateNameEnum | null, message: string | null } } | null };

export type Auth_ResetAuthStateMutationVariables = Exact<{ [key: string]: never; }>;


export type Auth_ResetAuthStateMutation = { __typename?: 'Mutation', resetAuthState: { __typename?: 'Query', cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null, authState: { __typename?: 'AuthState', browserOpened: boolean, name: AuthStateNameEnum | null, message: string | null } } };

export type ChooseExternalEditorFragment = { __typename?: 'Query', localSettings: { __typename?: 'LocalSettings', availableEditors: Array<{ __typename?: 'Editor', id: string, name: string, binary: string }>, preferences: { __typename?: 'LocalSettingsPreferences', preferredEditorBinary: string | null } } };

export type ChooseExternalEditorModalFragment = { __typename?: 'Query', localSettings: { __typename?: 'LocalSettings', availableEditors: Array<{ __typename?: 'Editor', id: string, name: string, binary: string }>, preferences: { __typename?: 'LocalSettingsPreferences', preferredEditorBinary: string | null } } };

export type ChooseExternalEditorModal_SetPreferredEditorBinaryMutationVariables = Exact<{
  value: Scalars['String'];
}>;


export type ChooseExternalEditorModal_SetPreferredEditorBinaryMutation = { __typename?: 'Mutation', setPreferences: { __typename?: 'Query', localSettings: { __typename?: 'LocalSettings', preferences: { __typename?: 'LocalSettingsPreferences', preferredEditorBinary: string | null } } } | null };

export type HeaderBar_HeaderBarQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type HeaderBar_HeaderBarQueryQuery = { __typename?: 'Query', projectRootFromCI: boolean, currentProject: { __typename?: 'CurrentProject', id: string, title: string, config: any, savedState: any | null, packageManager: PackageManagerEnum, currentBrowser: { __typename?: 'Browser', id: string, displayName: string, majorVersion: string | null } | null, browsers: Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: string | null, isVersionSupported: boolean, warning: string | null, disabled: boolean }> | null } | null, versions: { __typename?: 'VersionData', current: { __typename?: 'Version', id: string, version: string, released: string }, latest: { __typename?: 'Version', id: string, version: string, released: string } } | null, cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null, authState: { __typename?: 'AuthState', browserOpened: boolean, name: AuthStateNameEnum | null, message: string | null } };

export type HeaderBarContent_AuthChangeSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type HeaderBarContent_AuthChangeSubscription = { __typename?: 'Subscription', authChange: { __typename?: 'Query', cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null, authState: { __typename?: 'AuthState', browserOpened: boolean, name: AuthStateNameEnum | null, message: string | null } } | null };

export type GlobalPageHeader_ClearCurrentProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type GlobalPageHeader_ClearCurrentProjectMutation = { __typename?: 'Mutation', clearCurrentProject: { __typename?: 'Query', currentProject: { __typename?: 'CurrentProject', id: string } | null } | null };

export type HeaderBar_HeaderBarContentFragment = { __typename?: 'Query', projectRootFromCI: boolean, currentProject: { __typename?: 'CurrentProject', id: string, title: string, config: any, savedState: any | null, packageManager: PackageManagerEnum, currentBrowser: { __typename?: 'Browser', id: string, displayName: string, majorVersion: string | null } | null, browsers: Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: string | null, isVersionSupported: boolean, warning: string | null, disabled: boolean }> | null } | null, versions: { __typename?: 'VersionData', current: { __typename?: 'Version', id: string, version: string, released: string }, latest: { __typename?: 'Version', id: string, version: string, released: string } } | null, cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null, authState: { __typename?: 'AuthState', browserOpened: boolean, name: AuthStateNameEnum | null, message: string | null } };

export type OpenConfigFileInIdeFragment = { __typename?: 'CurrentProject', id: string, configFile: string | null, configFileAbsolutePath: string | null };

export type OpenFileInIdeQueryVariables = Exact<{ [key: string]: never; }>;


export type OpenFileInIdeQuery = { __typename?: 'Query', localSettings: { __typename?: 'LocalSettings', preferences: { __typename?: 'LocalSettingsPreferences', preferredEditorBinary: string | null }, availableEditors: Array<{ __typename?: 'Editor', id: string, name: string, binary: string }> } };

export type OpenFileInIde_MutationMutationVariables = Exact<{
  input: FileDetailsInput;
}>;


export type OpenFileInIde_MutationMutation = { __typename?: 'Mutation', openFileInIDE: boolean | null };

export type TestingTypeSelectionAndReconfigureMutationVariables = Exact<{
  testingType: TestingTypeEnum;
  isApp: Scalars['Boolean'];
}>;


export type TestingTypeSelectionAndReconfigureMutation = { __typename?: 'Mutation', setTestingTypeAndReconfigureProject: { __typename?: 'Query', currentProject: { __typename?: 'CurrentProject', id: string, currentTestingType: TestingTypeEnum | null, isCTConfigured: boolean | null, isE2EConfigured: boolean | null, isLoadingConfigFile: boolean | null, isLoadingNodeEvents: boolean | null } | null } | null };

export type TestingTypePickerFragment = { __typename?: 'Query', currentProject: { __typename?: 'CurrentProject', id: string, isCTConfigured: boolean | null, isE2EConfigured: boolean | null, currentTestingType: TestingTypeEnum | null } | null };

export type LoginModalFragment = { __typename?: 'Query', cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null, authState: { __typename?: 'AuthState', browserOpened: boolean, name: AuthStateNameEnum | null, message: string | null } };

export type TopNavFragment = { __typename?: 'Query', versions: { __typename?: 'VersionData', current: { __typename?: 'Version', id: string, version: string, released: string }, latest: { __typename?: 'Version', id: string, version: string, released: string } } | null, currentProject: { __typename?: 'CurrentProject', id: string, title: string, packageManager: PackageManagerEnum, currentBrowser: { __typename?: 'Browser', id: string, displayName: string, majorVersion: string | null } | null, browsers: Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: string | null, isVersionSupported: boolean, warning: string | null, disabled: boolean }> | null } | null };

export type TopNav_SetPromptShownMutationVariables = Exact<{
  slug: Scalars['String'];
}>;


export type TopNav_SetPromptShownMutation = { __typename?: 'Mutation', setPromptShown: boolean | null };

export type VerticalBrowserListItemsFragment = { __typename?: 'CurrentProject', id: string, browsers: Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: string | null, isVersionSupported: boolean, warning: string | null, disabled: boolean }> | null };

export type VerticalBrowserListItems_SetBrowserMutationVariables = Exact<{
  id: Scalars['ID'];
  specPath: InputMaybe<Scalars['String']>;
}>;


export type VerticalBrowserListItems_SetBrowserMutation = { __typename?: 'Mutation', launchpadSetBrowser: { __typename?: 'CurrentProject', id: string, browsers: Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: string | null, isVersionSupported: boolean, warning: string | null, disabled: boolean }> | null } | null, launchOpenProject: { __typename?: 'CurrentProject', id: string } | null };

export type Clipboard_CopyToClipboardMutationVariables = Exact<{
  text: Scalars['String'];
}>;


export type Clipboard_CopyToClipboardMutation = { __typename?: 'Mutation', copyTextToClipboard: boolean | null };

export type ExternalLink_OpenExternalMutationVariables = Exact<{
  url: Scalars['String'];
  includeGraphqlPort: InputMaybe<Scalars['Boolean']>;
}>;


export type ExternalLink_OpenExternalMutation = { __typename?: 'Mutation', openExternal: boolean | null };

export const ChooseExternalEditorFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChooseExternalEditor"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableEditors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"binary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferredEditorBinary"}}]}}]}}]}}]} as unknown as DocumentNode<ChooseExternalEditorFragment, unknown>;
export const ChooseExternalEditorModalFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChooseExternalEditorModal"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChooseExternalEditor"}}]}},...ChooseExternalEditorFragmentDoc.definitions]} as unknown as DocumentNode<ChooseExternalEditorModalFragment, unknown>;
export const VerticalBrowserListItemsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VerticalBrowserListItems"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CurrentProject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"browsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}},{"kind":"Field","name":{"kind":"Name","value":"isVersionSupported"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}}]}}]}}]} as unknown as DocumentNode<VerticalBrowserListItemsFragment, unknown>;
export const TopNavFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopNav"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"current"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"released"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"released"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"packageManager"}},{"kind":"Field","name":{"kind":"Name","value":"currentBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VerticalBrowserListItems"}}]}}]}},...VerticalBrowserListItemsFragmentDoc.definitions]} as unknown as DocumentNode<TopNavFragment, unknown>;
export const AuthFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Auth"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloudViewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"authState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"browserOpened"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<AuthFragment, unknown>;
export const HeaderBar_HeaderBarContentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeaderBar_HeaderBarContent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"savedState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projectRootFromCI"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TopNav"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}},...TopNavFragmentDoc.definitions,...AuthFragmentDoc.definitions]} as unknown as DocumentNode<HeaderBar_HeaderBarContentFragment, unknown>;
export const OpenConfigFileInIdeFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OpenConfigFileInIDE"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CurrentProject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"configFile"}},{"kind":"Field","name":{"kind":"Name","value":"configFileAbsolutePath"}}]}}]} as unknown as DocumentNode<OpenConfigFileInIdeFragment, unknown>;
export const TestingTypePickerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestingTypePicker"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isCTConfigured"}},{"kind":"Field","name":{"kind":"Name","value":"isE2EConfigured"}},{"kind":"Field","name":{"kind":"Name","value":"currentTestingType"}}]}}]}}]} as unknown as DocumentNode<TestingTypePickerFragment, unknown>;
export const LoginModalFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LoginModal"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}},...AuthFragmentDoc.definitions]} as unknown as DocumentNode<LoginModalFragment, unknown>;
export const Auth_LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Auth_Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}}]}},...AuthFragmentDoc.definitions]} as unknown as DocumentNode<Auth_LogoutMutation, Auth_LogoutMutationVariables>;
export const Auth_LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Auth_Login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}}]}},...AuthFragmentDoc.definitions]} as unknown as DocumentNode<Auth_LoginMutation, Auth_LoginMutationVariables>;
export const Auth_ResetAuthStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Auth_ResetAuthState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetAuthState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}}]}},...AuthFragmentDoc.definitions]} as unknown as DocumentNode<Auth_ResetAuthStateMutation, Auth_ResetAuthStateMutationVariables>;
export const ChooseExternalEditorModal_SetPreferredEditorBinaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChooseExternalEditorModal_SetPreferredEditorBinary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferredEditorBinary"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChooseExternalEditorModal_SetPreferredEditorBinaryMutation, ChooseExternalEditorModal_SetPreferredEditorBinaryMutationVariables>;
export const HeaderBar_HeaderBarQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HeaderBar_HeaderBarQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeaderBar_HeaderBarContent"}}]}},...HeaderBar_HeaderBarContentFragmentDoc.definitions]} as unknown as DocumentNode<HeaderBar_HeaderBarQueryQuery, HeaderBar_HeaderBarQueryQueryVariables>;
export const HeaderBarContent_AuthChangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"HeaderBarContent_authChange"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authChange"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}}]}},...AuthFragmentDoc.definitions]} as unknown as DocumentNode<HeaderBarContent_AuthChangeSubscription, HeaderBarContent_AuthChangeSubscriptionVariables>;
export const GlobalPageHeader_ClearCurrentProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPageHeader_clearCurrentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearCurrentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GlobalPageHeader_ClearCurrentProjectMutation, GlobalPageHeader_ClearCurrentProjectMutationVariables>;
export const OpenFileInIdeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OpenFileInIDE"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferredEditorBinary"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChooseExternalEditorModal"}}]}},...ChooseExternalEditorModalFragmentDoc.definitions]} as unknown as DocumentNode<OpenFileInIdeQuery, OpenFileInIdeQueryVariables>;
export const OpenFileInIde_MutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OpenFileInIDE_Mutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FileDetailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openFileInIDE"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<OpenFileInIde_MutationMutation, OpenFileInIde_MutationMutationVariables>;
export const TestingTypeSelectionAndReconfigureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestingTypeSelectionAndReconfigure"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestingTypeEnum"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isApp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTestingTypeAndReconfigureProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"testingType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}}},{"kind":"Argument","name":{"kind":"Name","value":"isApp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isApp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentTestingType"}},{"kind":"Field","name":{"kind":"Name","value":"isCTConfigured"}},{"kind":"Field","name":{"kind":"Name","value":"isE2EConfigured"}},{"kind":"Field","name":{"kind":"Name","value":"isLoadingConfigFile"}},{"kind":"Field","name":{"kind":"Name","value":"isLoadingNodeEvents"}}]}}]}}]}}]} as unknown as DocumentNode<TestingTypeSelectionAndReconfigureMutation, TestingTypeSelectionAndReconfigureMutationVariables>;
export const TopNav_SetPromptShownDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TopNav_SetPromptShown"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPromptShown"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}]}]}}]} as unknown as DocumentNode<TopNav_SetPromptShownMutation, TopNav_SetPromptShownMutationVariables>;
export const VerticalBrowserListItems_SetBrowserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerticalBrowserListItems_SetBrowser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"specPath"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"launchpadSetBrowser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VerticalBrowserListItems"}}]}},{"kind":"Field","name":{"kind":"Name","value":"launchOpenProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"specPath"},"value":{"kind":"Variable","name":{"kind":"Name","value":"specPath"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},...VerticalBrowserListItemsFragmentDoc.definitions]} as unknown as DocumentNode<VerticalBrowserListItems_SetBrowserMutation, VerticalBrowserListItems_SetBrowserMutationVariables>;
export const Clipboard_CopyToClipboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Clipboard_CopyToClipboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"text"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"copyTextToClipboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"text"},"value":{"kind":"Variable","name":{"kind":"Name","value":"text"}}}]}]}}]} as unknown as DocumentNode<Clipboard_CopyToClipboardMutation, Clipboard_CopyToClipboardMutationVariables>;
export const ExternalLink_OpenExternalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExternalLink_OpenExternal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeGraphqlPort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openExternal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeGraphqlPort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeGraphqlPort"}}}]}]}}]} as unknown as DocumentNode<ExternalLink_OpenExternalMutation, ExternalLink_OpenExternalMutationVariables>;