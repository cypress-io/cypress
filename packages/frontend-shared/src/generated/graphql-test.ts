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

export interface FileDetailsInput {
  readonly absolute: Scalars['String'];
  readonly column: InputMaybe<Scalars['Int']>;
  readonly line: InputMaybe<Scalars['Int']>;
}

export type FrontendFrameworkCategoryEnum =
  | 'react'
  | 'vue';

export type FrontendFrameworkEnum =
  | 'cra'
  | 'nextjs'
  | 'nuxtjs'
  | 'react'
  | 'vue'
  | 'vuecli';

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

export type AuthFragment = { __typename?: 'Query', isAuthBrowserOpened: boolean, cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: { __typename?: 'Query', isAuthBrowserOpened: boolean, cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null } | null };

export type LoginMutationVariables = Exact<{ [key: string]: never; }>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'Query', isAuthBrowserOpened: boolean, cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null } | null };

export type BrowserOpenedQueryVariables = Exact<{ [key: string]: never; }>;


export type BrowserOpenedQuery = { __typename?: 'Query', isAuthBrowserOpened: boolean };

export type ChooseExternalEditorFragment = { __typename?: 'Query', localSettings: { __typename?: 'LocalSettings', availableEditors: Array<{ __typename?: 'Editor', id: string, name: string, binary: string }>, preferences: { __typename?: 'LocalSettingsPreferences', preferredEditorBinary: string | null } } };

export type ChooseExternalEditorModalFragment = { __typename?: 'Query', localSettings: { __typename?: 'LocalSettings', availableEditors: Array<{ __typename?: 'Editor', id: string, name: string, binary: string }>, preferences: { __typename?: 'LocalSettingsPreferences', preferredEditorBinary: string | null } } };

export type ChooseExternalEditorModal_SetPreferredEditorBinaryMutationVariables = Exact<{
  value: Scalars['String'];
}>;


export type ChooseExternalEditorModal_SetPreferredEditorBinaryMutation = { __typename?: 'Mutation', setPreferences: { __typename?: 'Query', localSettings: { __typename?: 'LocalSettings', preferences: { __typename?: 'LocalSettingsPreferences', preferredEditorBinary: string | null } } } | null };

export type HeaderBar_HeaderBarQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type HeaderBar_HeaderBarQueryQuery = { __typename?: 'Query', isAuthBrowserOpened: boolean, currentProject: { __typename?: 'CurrentProject', id: string, title: string, config: any, savedState: any | null, packageManager: PackageManagerEnum, currentBrowser: { __typename?: 'Browser', id: string, displayName: string, majorVersion: string | null } | null, browsers: Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: string | null, isVersionSupported: boolean, warning: string | null, disabled: boolean }> | null } | null, versions: { __typename?: 'VersionData', current: { __typename?: 'Version', id: string, version: string, released: string }, latest: { __typename?: 'Version', id: string, version: string, released: string } } | null, cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null };

export type GlobalPageHeader_ClearCurrentProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type GlobalPageHeader_ClearCurrentProjectMutation = { __typename?: 'Mutation', clearCurrentProject: { __typename?: 'Query', currentProject: { __typename?: 'CurrentProject', id: string } | null } | null };

export type HeaderBar_HeaderBarContentFragment = { __typename?: 'Query', isAuthBrowserOpened: boolean, currentProject: { __typename?: 'CurrentProject', id: string, title: string, config: any, savedState: any | null, packageManager: PackageManagerEnum, currentBrowser: { __typename?: 'Browser', id: string, displayName: string, majorVersion: string | null } | null, browsers: Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: string | null, isVersionSupported: boolean, warning: string | null, disabled: boolean }> | null } | null, versions: { __typename?: 'VersionData', current: { __typename?: 'Version', id: string, version: string, released: string }, latest: { __typename?: 'Version', id: string, version: string, released: string } } | null, cloudViewer: { __typename?: 'CloudUser', id: string, email: string | null, fullName: string | null } | null };

export type OpenConfigFileInIdeQueryVariables = Exact<{ [key: string]: never; }>;


export type OpenConfigFileInIdeQuery = { __typename?: 'Query', currentProject: { __typename?: 'CurrentProject', id: string, configFile: string | null, configFileAbsolutePath: string | null } | null, localSettings: { __typename?: 'LocalSettings', preferences: { __typename?: 'LocalSettingsPreferences', preferredEditorBinary: string | null }, availableEditors: Array<{ __typename?: 'Editor', id: string, name: string, binary: string }> } };

export type OpenConfigFileMutationVariables = Exact<{
  input: FileDetailsInput;
}>;


export type OpenConfigFileMutation = { __typename?: 'Mutation', openFileInIDE: boolean | null };

export type TestingTypeSelectionAndReconfigureMutationVariables = Exact<{
  testingType: TestingTypeEnum;
  isApp: Scalars['Boolean'];
}>;


export type TestingTypeSelectionAndReconfigureMutation = { __typename?: 'Mutation', setTestingTypeAndReconfigureProject: { __typename?: 'Query', currentTestingType: TestingTypeEnum | null, currentProject: { __typename?: 'CurrentProject', id: string, currentTestingType: TestingTypeEnum | null, isCTConfigured: boolean | null, isE2EConfigured: boolean | null, isLoadingConfigFile: boolean | null, isLoadingNodeEvents: boolean | null } | null } | null };

export type TestingTypePickerFragment = { __typename?: 'Query', currentProject: { __typename?: 'CurrentProject', id: string, isCTConfigured: boolean | null, isE2EConfigured: boolean | null, currentTestingType: TestingTypeEnum | null } | null };

export type LoginModalFragment = { __typename?: 'Query', isAuthBrowserOpened: boolean, cloudViewer: { __typename?: 'CloudUser', id: string, fullName: string | null, email: string | null } | null };

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

export type ExternalLink_OpenExternalMutationVariables = Exact<{
  url: Scalars['String'];
}>;


export type ExternalLink_OpenExternalMutation = { __typename?: 'Mutation', openExternal: boolean | null };

export const ChooseExternalEditorFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChooseExternalEditor"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableEditors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"binary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferredEditorBinary"}}]}}]}}]}}]} as unknown as DocumentNode<ChooseExternalEditorFragment, unknown>;
export const ChooseExternalEditorModalFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChooseExternalEditorModal"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChooseExternalEditor"}}]}},...ChooseExternalEditorFragmentDoc.definitions]} as unknown as DocumentNode<ChooseExternalEditorModalFragment, unknown>;
export const VerticalBrowserListItemsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VerticalBrowserListItems"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CurrentProject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"browsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}},{"kind":"Field","name":{"kind":"Name","value":"isVersionSupported"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}}]}}]}}]} as unknown as DocumentNode<VerticalBrowserListItemsFragment, unknown>;
export const TopNavFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopNav"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"current"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"released"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"released"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"packageManager"}},{"kind":"Field","name":{"kind":"Name","value":"currentBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VerticalBrowserListItems"}}]}}]}},...VerticalBrowserListItemsFragmentDoc.definitions]} as unknown as DocumentNode<TopNavFragment, unknown>;
export const AuthFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Auth"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloudViewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}}]} as unknown as DocumentNode<AuthFragment, unknown>;
export const HeaderBar_HeaderBarContentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeaderBar_HeaderBarContent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"savedState"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TopNav"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}},...TopNavFragmentDoc.definitions,...AuthFragmentDoc.definitions]} as unknown as DocumentNode<HeaderBar_HeaderBarContentFragment, unknown>;
export const TestingTypePickerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestingTypePicker"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isCTConfigured"}},{"kind":"Field","name":{"kind":"Name","value":"isE2EConfigured"}},{"kind":"Field","name":{"kind":"Name","value":"currentTestingType"}}]}}]}}]} as unknown as DocumentNode<TestingTypePickerFragment, unknown>;
export const LoginModalFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LoginModal"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloudViewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}},...AuthFragmentDoc.definitions]} as unknown as DocumentNode<LoginModalFragment, unknown>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}}]}},...AuthFragmentDoc.definitions]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}}]}},...AuthFragmentDoc.definitions]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const BrowserOpenedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BrowserOpened"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}}]} as unknown as DocumentNode<BrowserOpenedQuery, BrowserOpenedQueryVariables>;
export const ChooseExternalEditorModal_SetPreferredEditorBinaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChooseExternalEditorModal_SetPreferredEditorBinary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferredEditorBinary"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChooseExternalEditorModal_SetPreferredEditorBinaryMutation, ChooseExternalEditorModal_SetPreferredEditorBinaryMutationVariables>;
export const HeaderBar_HeaderBarQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HeaderBar_HeaderBarQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeaderBar_HeaderBarContent"}}]}},...HeaderBar_HeaderBarContentFragmentDoc.definitions]} as unknown as DocumentNode<HeaderBar_HeaderBarQueryQuery, HeaderBar_HeaderBarQueryQueryVariables>;
export const GlobalPageHeader_ClearCurrentProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPageHeader_clearCurrentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearCurrentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GlobalPageHeader_ClearCurrentProjectMutation, GlobalPageHeader_ClearCurrentProjectMutationVariables>;
export const OpenConfigFileInIdeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OpenConfigFileInIDE"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"configFile"}},{"kind":"Field","name":{"kind":"Name","value":"configFileAbsolutePath"}}]}},{"kind":"Field","name":{"kind":"Name","value":"localSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"preferredEditorBinary"}}]}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChooseExternalEditorModal"}}]}},...ChooseExternalEditorModalFragmentDoc.definitions]} as unknown as DocumentNode<OpenConfigFileInIdeQuery, OpenConfigFileInIdeQueryVariables>;
export const OpenConfigFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OpenConfigFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FileDetailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openFileInIDE"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<OpenConfigFileMutation, OpenConfigFileMutationVariables>;
export const TestingTypeSelectionAndReconfigureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestingTypeSelectionAndReconfigure"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestingTypeEnum"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isApp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTestingTypeAndReconfigureProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"testingType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}}},{"kind":"Argument","name":{"kind":"Name","value":"isApp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isApp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentTestingType"}},{"kind":"Field","name":{"kind":"Name","value":"currentProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentTestingType"}},{"kind":"Field","name":{"kind":"Name","value":"isCTConfigured"}},{"kind":"Field","name":{"kind":"Name","value":"isE2EConfigured"}},{"kind":"Field","name":{"kind":"Name","value":"isLoadingConfigFile"}},{"kind":"Field","name":{"kind":"Name","value":"isLoadingNodeEvents"}}]}}]}}]}}]} as unknown as DocumentNode<TestingTypeSelectionAndReconfigureMutation, TestingTypeSelectionAndReconfigureMutationVariables>;
export const TopNav_SetPromptShownDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TopNav_SetPromptShown"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPromptShown"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}]}]}}]} as unknown as DocumentNode<TopNav_SetPromptShownMutation, TopNav_SetPromptShownMutationVariables>;
export const VerticalBrowserListItems_SetBrowserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerticalBrowserListItems_SetBrowser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"specPath"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"launchpadSetBrowser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"VerticalBrowserListItems"}}]}},{"kind":"Field","name":{"kind":"Name","value":"launchOpenProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"specPath"},"value":{"kind":"Variable","name":{"kind":"Name","value":"specPath"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},...VerticalBrowserListItemsFragmentDoc.definitions]} as unknown as DocumentNode<VerticalBrowserListItems_SetBrowserMutation, VerticalBrowserListItems_SetBrowserMutationVariables>;
export const ExternalLink_OpenExternalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExternalLink_OpenExternal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openExternal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}]}]}}]} as unknown as DocumentNode<ExternalLink_OpenExternalMutation, ExternalLink_OpenExternalMutationVariables>;