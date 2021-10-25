/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
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
  | 'story';

export type CodeLanguageEnum =
  | 'js'
  | 'ts';

export type DevRelaunchAction =
  | 'dismiss'
  | 'trigger';

export type FrontendFrameworkEnum =
  | 'cra'
  | 'nextjs'
  | 'nuxtjs'
  | 'react'
  | 'vue'
  | 'vuecli';

export type NavItem =
  | 'learn'
  | 'projectSetup'
  | 'runs'
  | 'settings';

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

export type WizardNavigateDirection =
  | 'back'
  | 'forward';

export type WizardStep =
  | 'configFiles'
  | 'initializePlugins'
  | 'installDependencies'
  | 'selectFramework'
  | 'setupComplete'
  | 'welcome';

export interface WizardUpdateInput {
  readonly direction: Maybe<WizardNavigateDirection>;
  readonly testingType: Maybe<TestingTypeEnum>;
}

export type AppQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AppQueryQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename: 'App' }, readonly dev: { readonly __typename?: 'DevState', readonly needsRelaunch: Maybe<boolean> } };

export type App_DevRelaunchMutationVariables = Exact<{
  action: DevRelaunchAction;
}>;


export type App_DevRelaunchMutation = { readonly __typename?: 'Mutation', readonly devRelaunch: Maybe<boolean> };

export type MainLaunchpadQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type MainLaunchpadQueryQuery = { readonly __typename?: 'Query', readonly baseError: Maybe<{ readonly __typename?: 'BaseError', readonly title: Maybe<string>, readonly message: Maybe<string>, readonly stack: Maybe<string> }>, readonly wizard: { readonly __typename?: 'Wizard', readonly canNavigateForward: boolean, readonly title: Maybe<string>, readonly description: Maybe<string>, readonly step: WizardStep, readonly testingType: Maybe<TestingTypeEnum>, readonly chosenTestingTypePluginsInitialized: boolean, readonly testingTypes: ReadonlyArray<{ readonly __typename?: 'TestingTypeInfo', readonly id: string, readonly type: TestingTypeEnum, readonly title: string, readonly description: string }>, readonly bundler: Maybe<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly name: string, readonly type: SupportedBundlers, readonly isSelected: Maybe<boolean> }>, readonly framework: Maybe<{ readonly __typename?: 'WizardFrontendFramework', readonly type: FrontendFrameworkEnum, readonly id: string, readonly name: string, readonly isSelected: boolean, readonly supportedBundlers: ReadonlyArray<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly type: SupportedBundlers, readonly name: string }> }>, readonly frameworks: ReadonlyArray<{ readonly __typename?: 'WizardFrontendFramework', readonly id: string, readonly name: string, readonly isSelected: boolean, readonly type: FrontendFrameworkEnum }>, readonly allBundlers: ReadonlyArray<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly name: string, readonly type: SupportedBundlers }>, readonly language: Maybe<{ readonly __typename?: 'WizardCodeLanguage', readonly id: string, readonly name: string, readonly isSelected: boolean, readonly type: CodeLanguageEnum }>, readonly allLanguages: ReadonlyArray<{ readonly __typename?: 'WizardCodeLanguage', readonly id: string, readonly name: string, readonly type: CodeLanguageEnum }>, readonly sampleConfigFiles: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardSampleConfigFile', readonly id: string, readonly filePath: string, readonly content: string, readonly status: WizardConfigFileStatusEnum, readonly description: Maybe<string> }>>, readonly packagesToInstall: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardNpmPackage', readonly id: string, readonly name: string, readonly description: string, readonly package: string }>> }, readonly app: { readonly __typename?: 'App', readonly isInGlobalMode: boolean, readonly isAuthBrowserOpened: boolean, readonly activeProject: Maybe<{ readonly __typename?: 'Project', readonly id: string, readonly isFirstTimeCT: boolean, readonly isFirstTimeE2E: boolean, readonly title: string }>, readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string, readonly majorVersion: Maybe<string> }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly name: string, readonly family: BrowserFamily, readonly disabled: boolean, readonly isSelected: boolean, readonly channel: string, readonly displayName: string, readonly path: string, readonly version: string, readonly majorVersion: Maybe<string> }>>, readonly projects: ReadonlyArray<{ readonly __typename?: 'Project', readonly id: string, readonly title: string, readonly projectRoot: string, readonly cloudProject: Maybe<{ readonly __typename?: 'CloudProject', readonly latestRun: Maybe<{ readonly __typename?: 'CloudRun', readonly status: Maybe<CloudRunStatus> }> }> }> }, readonly cloudViewer: Maybe<{ readonly __typename?: 'CloudUser', readonly id: string, readonly email: Maybe<string>, readonly fullName: Maybe<string> }> };

export type LoginModalFragment = { readonly __typename?: 'Query', readonly cloudViewer: Maybe<{ readonly __typename?: 'CloudUser', readonly id: string, readonly email: Maybe<string>, readonly fullName: Maybe<string> }>, readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean } };

export type TopNavFragment = { readonly __typename?: 'App', readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string, readonly majorVersion: Maybe<string> }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly isSelected: boolean, readonly displayName: string, readonly version: string, readonly majorVersion: Maybe<string> }>> };

export type BaseErrorFragment = { readonly __typename?: 'BaseError', readonly title: Maybe<string>, readonly message: Maybe<string>, readonly stack: Maybe<string> };

export type GlobalPage_AddProjectMutationVariables = Exact<{
  path: Scalars['String'];
  open?: Maybe<Scalars['Boolean']>;
}>;


export type GlobalPage_AddProjectMutation = { readonly __typename?: 'Mutation', readonly addProject: Maybe<boolean> };

export type GlobalPageFragment = { readonly __typename?: 'App', readonly projects: ReadonlyArray<{ readonly __typename?: 'Project', readonly id: string, readonly title: string, readonly projectRoot: string, readonly cloudProject: Maybe<{ readonly __typename?: 'CloudProject', readonly latestRun: Maybe<{ readonly __typename?: 'CloudRun', readonly status: Maybe<CloudRunStatus> }> }> }> };

export type GlobalPage_RemoveProjectMutationVariables = Exact<{
  path: Scalars['String'];
}>;


export type GlobalPage_RemoveProjectMutation = { readonly __typename?: 'Mutation', readonly removeProject: Maybe<boolean> };

export type GlobalProjectCard_SetActiveProjectMutationVariables = Exact<{
  path: Scalars['String'];
}>;


export type GlobalProjectCard_SetActiveProjectMutation = { readonly __typename?: 'Mutation', readonly setActiveProject: Maybe<boolean> };

export type GlobalProjectCardFragment = { readonly __typename?: 'Project', readonly id: string, readonly title: string, readonly projectRoot: string, readonly cloudProject: Maybe<{ readonly __typename?: 'CloudProject', readonly latestRun: Maybe<{ readonly __typename?: 'CloudRun', readonly status: Maybe<CloudRunStatus> }> }> };

export type GlobalPageHeader_ClearActiveProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type GlobalPageHeader_ClearActiveProjectMutation = { readonly __typename?: 'Mutation', readonly clearActiveProject: Maybe<boolean> };

export type HeaderBarFragment = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean, readonly activeProject: Maybe<{ readonly __typename?: 'Project', readonly id: string, readonly title: string }>, readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string, readonly majorVersion: Maybe<string> }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly isSelected: boolean, readonly displayName: string, readonly version: string, readonly majorVersion: Maybe<string> }>> }, readonly cloudViewer: Maybe<{ readonly __typename?: 'CloudUser', readonly id: string, readonly email: Maybe<string>, readonly fullName: Maybe<string> }> };

export type LayoutQueryVariables = Exact<{ [key: string]: never; }>;


export type LayoutQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly activeProject: Maybe<{ readonly __typename?: 'Project', readonly id: string, readonly title: string }> }, readonly navigationMenu: Maybe<{ readonly __typename?: 'NavigationMenu', readonly selected: NavItem, readonly items: ReadonlyArray<{ readonly __typename?: 'NavigationItem', readonly id: string, readonly name: string, readonly selected: boolean, readonly iconPath: string, readonly type: NavItem }> }> };

export type NavigationMenuSetItemMutationVariables = Exact<{
  type: NavItem;
}>;


export type NavigationMenuSetItemMutation = { readonly __typename?: 'Mutation', readonly navigationMenuSetItem: Maybe<boolean> };

export type SideBarItemFragment = { readonly __typename?: 'NavigationItem', readonly id: string, readonly name: string, readonly selected: boolean, readonly iconPath: string, readonly type: NavItem };

export type RunCardFragment = { readonly __typename?: 'CloudRun', readonly id: string, readonly createdAt: Maybe<string>, readonly status: Maybe<CloudRunStatus>, readonly totalPassed: Maybe<number>, readonly totalFailed: Maybe<number>, readonly totalPending: Maybe<number>, readonly totalSkipped: Maybe<number>, readonly totalDuration: Maybe<number>, readonly commitInfo: Maybe<{ readonly __typename?: 'CloudRunCommitInfo', readonly authorName: Maybe<string>, readonly authorEmail: Maybe<string>, readonly summary: Maybe<string>, readonly branch: Maybe<string> }> };

export type RunIconFragment = { readonly __typename?: 'CloudRun', readonly id: string, readonly status: Maybe<CloudRunStatus> };

export type RunResultsFragment = { readonly __typename?: 'CloudRun', readonly id: string, readonly totalPassed: Maybe<number>, readonly totalFailed: Maybe<number>, readonly totalPending: Maybe<number>, readonly totalSkipped: Maybe<number>, readonly totalDuration: Maybe<number> };

export type RunsPageFragment = { readonly __typename?: 'CloudProject', readonly runs: Maybe<{ readonly __typename?: 'CloudRunConnection', readonly nodes: ReadonlyArray<{ readonly __typename?: 'CloudRun', readonly id: string, readonly createdAt: Maybe<string>, readonly status: Maybe<CloudRunStatus>, readonly totalPassed: Maybe<number>, readonly totalFailed: Maybe<number>, readonly totalPending: Maybe<number>, readonly totalSkipped: Maybe<number>, readonly totalDuration: Maybe<number>, readonly commitInfo: Maybe<{ readonly __typename?: 'CloudRunCommitInfo', readonly authorName: Maybe<string>, readonly authorEmail: Maybe<string>, readonly summary: Maybe<string>, readonly branch: Maybe<string> }> }> }> };

export type ProjectIdFragment = { readonly __typename?: 'Project', readonly projectId: Maybe<string> };

export type ProjectSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type ProjectSettingsQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly activeProject: Maybe<{ readonly __typename?: 'Project', readonly id: string, readonly projectId: Maybe<string>, readonly cloudProject: Maybe<{ readonly __typename?: 'CloudProject', readonly id: string, readonly recordKeys: Maybe<ReadonlyArray<{ readonly __typename?: 'CloudRecordKey', readonly id: string, readonly key: Maybe<string> }>> }> }> } };

export type RecordKeyFragment = { readonly __typename?: 'CloudRecordKey', readonly id: string, readonly key: Maybe<string> };

export type AuthFragment = { readonly __typename?: 'Query', readonly cloudViewer: Maybe<{ readonly __typename?: 'CloudUser', readonly id: string, readonly email: Maybe<string>, readonly fullName: Maybe<string> }>, readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { readonly __typename?: 'Mutation', readonly logout: Maybe<boolean> };

export type LoginMutationVariables = Exact<{ [key: string]: never; }>;


export type LoginMutation = { readonly __typename?: 'Mutation', readonly login: Maybe<boolean> };

export type BrowserOpenedQueryVariables = Exact<{ [key: string]: never; }>;


export type BrowserOpenedQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean } };

export type ConfigFilesFragment = { readonly __typename?: 'Wizard', readonly sampleConfigFiles: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardSampleConfigFile', readonly id: string, readonly filePath: string, readonly content: string, readonly status: WizardConfigFileStatusEnum, readonly description: Maybe<string> }>> };

export type ConfigFilesNavigateMutationVariables = Exact<{
  input: WizardUpdateInput;
}>;


export type ConfigFilesNavigateMutation = { readonly __typename?: 'Mutation', readonly wizardUpdate: Maybe<boolean> };

export type EnvironmentSetupSetFrameworkMutationVariables = Exact<{
  framework: FrontendFrameworkEnum;
}>;


export type EnvironmentSetupSetFrameworkMutation = { readonly __typename?: 'Mutation', readonly wizardSetFramework: Maybe<boolean> };

export type EnvironmentSetupSetBundlerMutationVariables = Exact<{
  bundler: SupportedBundlers;
}>;


export type EnvironmentSetupSetBundlerMutation = { readonly __typename?: 'Mutation', readonly wizardSetBundler: Maybe<boolean> };

export type EnvironmentSetupSetCodeLanguageMutationVariables = Exact<{
  language: CodeLanguageEnum;
}>;


export type EnvironmentSetupSetCodeLanguageMutation = { readonly __typename?: 'Mutation', readonly wizardSetCodeLanguage: Maybe<boolean> };

export type EnvironmentSetupFragment = { readonly __typename?: 'Wizard', readonly canNavigateForward: boolean, readonly bundler: Maybe<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly name: string, readonly type: SupportedBundlers, readonly isSelected: Maybe<boolean> }>, readonly framework: Maybe<{ readonly __typename?: 'WizardFrontendFramework', readonly type: FrontendFrameworkEnum, readonly id: string, readonly name: string, readonly isSelected: boolean, readonly supportedBundlers: ReadonlyArray<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly type: SupportedBundlers, readonly name: string }> }>, readonly frameworks: ReadonlyArray<{ readonly __typename?: 'WizardFrontendFramework', readonly id: string, readonly name: string, readonly isSelected: boolean, readonly type: FrontendFrameworkEnum }>, readonly allBundlers: ReadonlyArray<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly name: string, readonly type: SupportedBundlers }>, readonly language: Maybe<{ readonly __typename?: 'WizardCodeLanguage', readonly id: string, readonly name: string, readonly isSelected: boolean, readonly type: CodeLanguageEnum }>, readonly allLanguages: ReadonlyArray<{ readonly __typename?: 'WizardCodeLanguage', readonly id: string, readonly name: string, readonly type: CodeLanguageEnum }> };

export type InitializeConfig_WizardStateFragment = { readonly __typename?: 'Wizard', readonly canNavigateForward: boolean, readonly chosenTestingTypePluginsInitialized: boolean, readonly step: WizardStep };

export type InitializeConfig_ConfigFragment = { readonly __typename?: 'Query', readonly wizard: { readonly __typename?: 'Wizard', readonly canNavigateForward: boolean, readonly chosenTestingTypePluginsInitialized: boolean, readonly step: WizardStep }, readonly app: { readonly __typename?: 'App', readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly name: string, readonly family: BrowserFamily, readonly disabled: boolean, readonly isSelected: boolean, readonly channel: string, readonly displayName: string, readonly path: string, readonly version: string, readonly majorVersion: Maybe<string> }>> } };

export type InitializeOpenProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type InitializeOpenProjectMutation = { readonly __typename?: 'Mutation', readonly initializeOpenProject: Maybe<boolean> };

export type InstallDependenciesFragment = { readonly __typename?: 'Wizard', readonly canNavigateForward: boolean, readonly packagesToInstall: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardNpmPackage', readonly id: string, readonly name: string, readonly description: string, readonly package: string }>> };

export type ManualInstallFragment = { readonly __typename?: 'Wizard', readonly packagesToInstall: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardNpmPackage', readonly id: string, readonly name: string, readonly description: string, readonly package: string }>> };

export type OpenBrowserQueryVariables = Exact<{ [key: string]: never; }>;


export type OpenBrowserQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly name: string, readonly family: BrowserFamily, readonly disabled: boolean, readonly isSelected: boolean, readonly channel: string, readonly displayName: string, readonly path: string, readonly version: string, readonly majorVersion: Maybe<string> }>> } };

export type LaunchOpenProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type LaunchOpenProjectMutation = { readonly __typename?: 'Mutation', readonly launchOpenProject: Maybe<boolean> };

export type OpenBrowserList_SetBrowserMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type OpenBrowserList_SetBrowserMutation = { readonly __typename?: 'Mutation', readonly launchpadSetBrowser: Maybe<boolean> };

export type OpenBrowserListFragment = { readonly __typename?: 'App', readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly name: string, readonly family: BrowserFamily, readonly disabled: boolean, readonly isSelected: boolean, readonly channel: string, readonly displayName: string, readonly path: string, readonly version: string, readonly majorVersion: Maybe<string> }>> };

export type PackagesListFragment = { readonly __typename?: 'Wizard', readonly packagesToInstall: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardNpmPackage', readonly id: string, readonly name: string, readonly description: string }>> };

export type TestingType_SelectMutationVariables = Exact<{
  input: WizardUpdateInput;
}>;


export type TestingType_SelectMutation = { readonly __typename?: 'Mutation', readonly wizardUpdate: Maybe<boolean> };

export type TestingTypeFragment = { readonly __typename?: 'Wizard', readonly testingTypes: ReadonlyArray<{ readonly __typename?: 'TestingTypeInfo', readonly id: string, readonly type: TestingTypeEnum, readonly title: string, readonly description: string }> };

export type TestingTypeCardsFragment = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly activeProject: Maybe<{ readonly __typename?: 'Project', readonly id: string, readonly isFirstTimeCT: boolean, readonly isFirstTimeE2E: boolean }> }, readonly wizard: { readonly __typename?: 'Wizard', readonly testingTypes: ReadonlyArray<{ readonly __typename?: 'TestingTypeInfo', readonly id: string, readonly type: TestingTypeEnum, readonly title: string, readonly description: string }> } };

export type TestingTypeSelectionMutationVariables = Exact<{
  input: WizardUpdateInput;
}>;


export type TestingTypeSelectionMutation = { readonly __typename?: 'Mutation', readonly wizardUpdate: Maybe<boolean> };

export type WizardFragment = { readonly __typename?: 'Query', readonly wizard: { readonly __typename?: 'Wizard', readonly title: Maybe<string>, readonly description: Maybe<string>, readonly step: WizardStep, readonly testingType: Maybe<TestingTypeEnum>, readonly canNavigateForward: boolean, readonly chosenTestingTypePluginsInitialized: boolean, readonly bundler: Maybe<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly name: string, readonly type: SupportedBundlers, readonly isSelected: Maybe<boolean> }>, readonly framework: Maybe<{ readonly __typename?: 'WizardFrontendFramework', readonly type: FrontendFrameworkEnum, readonly id: string, readonly name: string, readonly isSelected: boolean, readonly supportedBundlers: ReadonlyArray<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly type: SupportedBundlers, readonly name: string }> }>, readonly frameworks: ReadonlyArray<{ readonly __typename?: 'WizardFrontendFramework', readonly id: string, readonly name: string, readonly isSelected: boolean, readonly type: FrontendFrameworkEnum }>, readonly allBundlers: ReadonlyArray<{ readonly __typename?: 'WizardBundler', readonly id: string, readonly name: string, readonly type: SupportedBundlers }>, readonly language: Maybe<{ readonly __typename?: 'WizardCodeLanguage', readonly id: string, readonly name: string, readonly isSelected: boolean, readonly type: CodeLanguageEnum }>, readonly allLanguages: ReadonlyArray<{ readonly __typename?: 'WizardCodeLanguage', readonly id: string, readonly name: string, readonly type: CodeLanguageEnum }>, readonly sampleConfigFiles: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardSampleConfigFile', readonly id: string, readonly filePath: string, readonly content: string, readonly status: WizardConfigFileStatusEnum, readonly description: Maybe<string> }>>, readonly packagesToInstall: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardNpmPackage', readonly id: string, readonly name: string, readonly description: string, readonly package: string }>> }, readonly app: { readonly __typename?: 'App', readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly name: string, readonly family: BrowserFamily, readonly disabled: boolean, readonly isSelected: boolean, readonly channel: string, readonly displayName: string, readonly path: string, readonly version: string, readonly majorVersion: Maybe<string> }>> } };

export type WizardHeaderFragment = { readonly __typename?: 'Wizard', readonly title: Maybe<string>, readonly description: Maybe<string> };

export type WizardLayoutFragment = { readonly __typename?: 'Wizard', readonly title: Maybe<string>, readonly description: Maybe<string>, readonly step: WizardStep, readonly canNavigateForward: boolean };

export type WizardLayoutNavigateMutationVariables = Exact<{
  input: WizardUpdateInput;
}>;


export type WizardLayoutNavigateMutation = { readonly __typename?: 'Mutation', readonly wizardUpdate: Maybe<boolean> };


export const AppQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AppQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dev"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needsRelaunch"}}]}}]}}]} as unknown as DocumentNode<AppQueryQuery, AppQueryQueryVariables>;
export const App_DevRelaunchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"App_DevRelaunch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DevRelaunchAction"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devRelaunch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}]}]}}]} as unknown as DocumentNode<App_DevRelaunchMutation, App_DevRelaunchMutationVariables>;
export const MainLaunchpadQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MainLaunchpadQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isFirstTimeCT"}},{"kind":"Field","name":{"kind":"Name","value":"isFirstTimeE2E"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"selectedBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}},{"kind":"Field","name":{"kind":"Name","value":"browsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"family"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isInGlobalMode"}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"projectRoot"}},{"kind":"Field","name":{"kind":"Name","value":"cloudProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latestRun"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}},{"kind":"Field","name":{"kind":"Name","value":"wizard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testingTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"step"}},{"kind":"Field","name":{"kind":"Name","value":"testingType"}},{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}},{"kind":"Field","name":{"kind":"Name","value":"bundler"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}}]}},{"kind":"Field","name":{"kind":"Name","value":"framework"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"supportedBundlers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"frameworks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allBundlers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"language"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allLanguages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"packagesToInstall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"package"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sampleConfigFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"chosenTestingTypePluginsInitialized"}}]}},{"kind":"Field","name":{"kind":"Name","value":"baseError"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stack"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloudViewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}}]}}]} as unknown as DocumentNode<MainLaunchpadQueryQuery, MainLaunchpadQueryQueryVariables>;
export const GlobalPage_AddProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPage_addProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"open"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}},{"kind":"Argument","name":{"kind":"Name","value":"open"},"value":{"kind":"Variable","name":{"kind":"Name","value":"open"}}}]}]}}]} as unknown as DocumentNode<GlobalPage_AddProjectMutation, GlobalPage_AddProjectMutationVariables>;
export const GlobalPage_RemoveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPage_RemoveProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}]}}]} as unknown as DocumentNode<GlobalPage_RemoveProjectMutation, GlobalPage_RemoveProjectMutationVariables>;
export const GlobalProjectCard_SetActiveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalProjectCard_setActiveProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setActiveProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}]}}]} as unknown as DocumentNode<GlobalProjectCard_SetActiveProjectMutation, GlobalProjectCard_SetActiveProjectMutationVariables>;
export const GlobalPageHeader_ClearActiveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPageHeader_clearActiveProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearActiveProject"}}]}}]} as unknown as DocumentNode<GlobalPageHeader_ClearActiveProjectMutation, GlobalPageHeader_ClearActiveProjectMutationVariables>;
export const LayoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Layout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"navigationMenu"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selected"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"selected"}},{"kind":"Field","name":{"kind":"Name","value":"iconPath"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]} as unknown as DocumentNode<LayoutQuery, LayoutQueryVariables>;
export const NavigationMenuSetItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NavigationMenuSetItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NavItem"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"navigationMenuSetItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}]}]}}]} as unknown as DocumentNode<NavigationMenuSetItemMutation, NavigationMenuSetItemMutationVariables>;
export const ProjectSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"cloudProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"recordKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProjectSettingsQuery, ProjectSettingsQueryVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const BrowserOpenedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BrowserOpened"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}}]}}]} as unknown as DocumentNode<BrowserOpenedQuery, BrowserOpenedQueryVariables>;
export const ConfigFilesNavigateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfigFilesNavigate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ConfigFilesNavigateMutation, ConfigFilesNavigateMutationVariables>;
export const EnvironmentSetupSetFrameworkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentSetupSetFramework"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"framework"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FrontendFrameworkEnum"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetFramework"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"framework"},"value":{"kind":"Variable","name":{"kind":"Name","value":"framework"}}}]}]}}]} as unknown as DocumentNode<EnvironmentSetupSetFrameworkMutation, EnvironmentSetupSetFrameworkMutationVariables>;
export const EnvironmentSetupSetBundlerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentSetupSetBundler"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"bundler"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedBundlers"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetBundler"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"bundler"},"value":{"kind":"Variable","name":{"kind":"Name","value":"bundler"}}}]}]}}]} as unknown as DocumentNode<EnvironmentSetupSetBundlerMutation, EnvironmentSetupSetBundlerMutationVariables>;
export const EnvironmentSetupSetCodeLanguageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentSetupSetCodeLanguage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CodeLanguageEnum"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetCodeLanguage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}}]} as unknown as DocumentNode<EnvironmentSetupSetCodeLanguageMutation, EnvironmentSetupSetCodeLanguageMutationVariables>;
export const InitializeOpenProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitializeOpenProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initializeOpenProject"}}]}}]} as unknown as DocumentNode<InitializeOpenProjectMutation, InitializeOpenProjectMutationVariables>;
export const OpenBrowserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OpenBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selectedBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"browsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"family"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}}]}}]}}]} as unknown as DocumentNode<OpenBrowserQuery, OpenBrowserQueryVariables>;
export const LaunchOpenProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LaunchOpenProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"launchOpenProject"}}]}}]} as unknown as DocumentNode<LaunchOpenProjectMutation, LaunchOpenProjectMutationVariables>;
export const OpenBrowserList_SetBrowserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OpenBrowserList_SetBrowser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"launchpadSetBrowser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<OpenBrowserList_SetBrowserMutation, OpenBrowserList_SetBrowserMutationVariables>;
export const TestingType_SelectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestingType_Select"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<TestingType_SelectMutation, TestingType_SelectMutationVariables>;
export const TestingTypeSelectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestingTypeSelection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<TestingTypeSelectionMutation, TestingTypeSelectionMutationVariables>;
export const WizardLayoutNavigateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WizardLayoutNavigate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<WizardLayoutNavigateMutation, WizardLayoutNavigateMutationVariables>;