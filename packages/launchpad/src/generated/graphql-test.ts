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


export type AppQueryQuery = { __typename?: 'Query', app: { __typename: 'App' }, dev: { __typename?: 'DevState', needsRelaunch: Maybe<boolean> } };

export type App_DevRelaunchMutationVariables = Exact<{
  action: DevRelaunchAction;
}>;


export type App_DevRelaunchMutation = { __typename?: 'Mutation', devRelaunch: Maybe<boolean> };

export type MainLaunchpadQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type MainLaunchpadQueryQuery = { __typename?: 'Query', baseError: Maybe<{ __typename?: 'BaseError', title: Maybe<string>, message: Maybe<string>, stack: Maybe<string> }>, wizard: { __typename?: 'Wizard', canNavigateForward: boolean, title: Maybe<string>, description: Maybe<string>, step: WizardStep, testingType: Maybe<TestingTypeEnum>, chosenTestingTypePluginsInitialized: boolean, testingTypes: Array<{ __typename?: 'TestingTypeInfo', id: string, type: TestingTypeEnum, title: string, description: string }>, bundler: Maybe<{ __typename?: 'WizardBundler', id: string, name: string, type: SupportedBundlers, isSelected: Maybe<boolean> }>, framework: Maybe<{ __typename?: 'WizardFrontendFramework', type: FrontendFrameworkEnum, id: string, name: string, isSelected: boolean, supportedBundlers: Array<{ __typename?: 'WizardBundler', id: string, type: SupportedBundlers, name: string }> }>, frameworks: Array<{ __typename?: 'WizardFrontendFramework', id: string, name: string, isSelected: boolean, type: FrontendFrameworkEnum }>, allBundlers: Array<{ __typename?: 'WizardBundler', id: string, name: string, type: SupportedBundlers }>, language: Maybe<{ __typename?: 'WizardCodeLanguage', id: string, name: string, isSelected: boolean, type: CodeLanguageEnum }>, allLanguages: Array<{ __typename?: 'WizardCodeLanguage', id: string, name: string, type: CodeLanguageEnum }>, sampleConfigFiles: Maybe<Array<{ __typename?: 'WizardSampleConfigFile', id: string, filePath: string, content: string, status: WizardConfigFileStatusEnum, description: Maybe<string> }>>, packagesToInstall: Maybe<Array<{ __typename?: 'WizardNpmPackage', id: string, name: string, description: string, package: string }>> }, app: { __typename?: 'App', isInGlobalMode: boolean, isAuthBrowserOpened: boolean, activeProject: Maybe<{ __typename?: 'Project', id: string, isFirstTimeCT: boolean, isFirstTimeE2E: boolean, title: string }>, selectedBrowser: Maybe<{ __typename?: 'Browser', id: string, displayName: string, majorVersion: Maybe<string> }>, browsers: Maybe<Array<{ __typename?: 'Browser', id: string, name: string, family: BrowserFamily, disabled: boolean, isSelected: boolean, channel: string, displayName: string, path: string, version: string, majorVersion: Maybe<string> }>>, projects: Array<{ __typename?: 'Project', id: string, title: string, projectRoot: string, cloudProject: Maybe<{ __typename?: 'CloudProject', latestRun: Maybe<{ __typename?: 'CloudRun', status: Maybe<CloudRunStatus> }> }> }> }, cloudViewer: Maybe<{ __typename?: 'CloudUser', id: string, email: Maybe<string>, fullName: Maybe<string> }> };

export type LoginModalFragment = { __typename?: 'Query', cloudViewer: Maybe<{ __typename?: 'CloudUser', id: string, email: Maybe<string>, fullName: Maybe<string> }>, app: { __typename?: 'App', isAuthBrowserOpened: boolean } };

export type TopNavFragment = { __typename?: 'App', selectedBrowser: Maybe<{ __typename?: 'Browser', id: string, displayName: string, majorVersion: Maybe<string> }>, browsers: Maybe<Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: Maybe<string> }>> };

export type BaseErrorFragment = { __typename?: 'BaseError', title: Maybe<string>, message: Maybe<string>, stack: Maybe<string> };

export type GlobalPage_AddProjectMutationVariables = Exact<{
  path: Scalars['String'];
  open?: Maybe<Scalars['Boolean']>;
}>;


export type GlobalPage_AddProjectMutation = { __typename?: 'Mutation', addProject: Maybe<boolean> };

export type GlobalPageFragment = { __typename?: 'App', projects: Array<{ __typename?: 'Project', id: string, title: string, projectRoot: string, cloudProject: Maybe<{ __typename?: 'CloudProject', latestRun: Maybe<{ __typename?: 'CloudRun', status: Maybe<CloudRunStatus> }> }> }> };

export type GlobalPage_RemoveProjectMutationVariables = Exact<{
  path: Scalars['String'];
}>;


export type GlobalPage_RemoveProjectMutation = { __typename?: 'Mutation', removeProject: Maybe<boolean> };

export type GlobalProjectCard_SetActiveProjectMutationVariables = Exact<{
  path: Scalars['String'];
}>;


export type GlobalProjectCard_SetActiveProjectMutation = { __typename?: 'Mutation', setActiveProject: Maybe<boolean> };

export type GlobalProjectCardFragment = { __typename?: 'Project', id: string, title: string, projectRoot: string, cloudProject: Maybe<{ __typename?: 'CloudProject', latestRun: Maybe<{ __typename?: 'CloudRun', status: Maybe<CloudRunStatus> }> }> };

export type GlobalPageHeader_ClearActiveProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type GlobalPageHeader_ClearActiveProjectMutation = { __typename?: 'Mutation', clearActiveProject: Maybe<boolean> };

export type HeaderBarFragment = { __typename?: 'Query', app: { __typename?: 'App', isAuthBrowserOpened: boolean, activeProject: Maybe<{ __typename?: 'Project', id: string, title: string }>, selectedBrowser: Maybe<{ __typename?: 'Browser', id: string, displayName: string, majorVersion: Maybe<string> }>, browsers: Maybe<Array<{ __typename?: 'Browser', id: string, isSelected: boolean, displayName: string, version: string, majorVersion: Maybe<string> }>> }, cloudViewer: Maybe<{ __typename?: 'CloudUser', id: string, email: Maybe<string>, fullName: Maybe<string> }> };

export type LayoutQueryVariables = Exact<{ [key: string]: never; }>;


export type LayoutQuery = { __typename?: 'Query', app: { __typename?: 'App', activeProject: Maybe<{ __typename?: 'Project', id: string, title: string }> }, navigationMenu: Maybe<{ __typename?: 'NavigationMenu', selected: NavItem, items: Array<{ __typename?: 'NavigationItem', id: string, name: string, selected: boolean, iconPath: string, type: NavItem }> }> };

export type NavigationMenuSetItemMutationVariables = Exact<{
  type: NavItem;
}>;


export type NavigationMenuSetItemMutation = { __typename?: 'Mutation', navigationMenuSetItem: Maybe<boolean> };

export type SideBarItemFragment = { __typename?: 'NavigationItem', id: string, name: string, selected: boolean, iconPath: string, type: NavItem };

export type RunCardFragment = { __typename?: 'CloudRun', id: string, createdAt: Maybe<string>, status: Maybe<CloudRunStatus>, totalPassed: Maybe<number>, totalFailed: Maybe<number>, totalPending: Maybe<number>, totalSkipped: Maybe<number>, totalDuration: Maybe<number>, commitInfo: Maybe<{ __typename?: 'CloudRunCommitInfo', authorName: Maybe<string>, authorEmail: Maybe<string>, summary: Maybe<string>, branch: Maybe<string> }> };

export type RunIconFragment = { __typename?: 'CloudRun', id: string, status: Maybe<CloudRunStatus> };

export type RunResultsFragment = { __typename?: 'CloudRun', id: string, totalPassed: Maybe<number>, totalFailed: Maybe<number>, totalPending: Maybe<number>, totalSkipped: Maybe<number>, totalDuration: Maybe<number> };

export type RunsPageFragment = { __typename?: 'CloudProject', runs: Maybe<{ __typename?: 'CloudRunConnection', nodes: Array<{ __typename?: 'CloudRun', id: string, createdAt: Maybe<string>, status: Maybe<CloudRunStatus>, totalPassed: Maybe<number>, totalFailed: Maybe<number>, totalPending: Maybe<number>, totalSkipped: Maybe<number>, totalDuration: Maybe<number>, commitInfo: Maybe<{ __typename?: 'CloudRunCommitInfo', authorName: Maybe<string>, authorEmail: Maybe<string>, summary: Maybe<string>, branch: Maybe<string> }> }> }> };

export type ProjectIdFragment = { __typename?: 'Project', projectId: Maybe<string> };

export type ProjectSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type ProjectSettingsQuery = { __typename?: 'Query', app: { __typename?: 'App', activeProject: Maybe<{ __typename?: 'Project', id: string, projectId: Maybe<string>, cloudProject: Maybe<{ __typename?: 'CloudProject', id: string, recordKeys: Maybe<Array<{ __typename?: 'CloudRecordKey', id: string, key: Maybe<string> }>> }> }> } };

export type RecordKeyFragment = { __typename?: 'CloudRecordKey', id: string, key: Maybe<string> };

export type AuthFragment = { __typename?: 'Query', cloudViewer: Maybe<{ __typename?: 'CloudUser', id: string, email: Maybe<string>, fullName: Maybe<string> }>, app: { __typename?: 'App', isAuthBrowserOpened: boolean } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: Maybe<boolean> };

export type LoginMutationVariables = Exact<{ [key: string]: never; }>;


export type LoginMutation = { __typename?: 'Mutation', login: Maybe<boolean> };

export type BrowserOpenedQueryVariables = Exact<{ [key: string]: never; }>;


export type BrowserOpenedQuery = { __typename?: 'Query', app: { __typename?: 'App', isAuthBrowserOpened: boolean } };

export type ConfigFilesFragment = { __typename?: 'Wizard', sampleConfigFiles: Maybe<Array<{ __typename?: 'WizardSampleConfigFile', id: string, filePath: string, content: string, status: WizardConfigFileStatusEnum, description: Maybe<string> }>> };

export type ConfigFilesNavigateMutationVariables = Exact<{
  input: WizardUpdateInput;
}>;


export type ConfigFilesNavigateMutation = { __typename?: 'Mutation', wizardUpdate: Maybe<boolean> };

export type EnvironmentSetupSetFrameworkMutationVariables = Exact<{
  framework: FrontendFrameworkEnum;
}>;


export type EnvironmentSetupSetFrameworkMutation = { __typename?: 'Mutation', wizardSetFramework: Maybe<boolean> };

export type EnvironmentSetupSetBundlerMutationVariables = Exact<{
  bundler: SupportedBundlers;
}>;


export type EnvironmentSetupSetBundlerMutation = { __typename?: 'Mutation', wizardSetBundler: Maybe<boolean> };

export type EnvironmentSetupSetCodeLanguageMutationVariables = Exact<{
  language: CodeLanguageEnum;
}>;


export type EnvironmentSetupSetCodeLanguageMutation = { __typename?: 'Mutation', wizardSetCodeLanguage: Maybe<boolean> };

export type EnvironmentSetupFragment = { __typename?: 'Wizard', canNavigateForward: boolean, bundler: Maybe<{ __typename?: 'WizardBundler', id: string, name: string, type: SupportedBundlers, isSelected: Maybe<boolean> }>, framework: Maybe<{ __typename?: 'WizardFrontendFramework', type: FrontendFrameworkEnum, id: string, name: string, isSelected: boolean, supportedBundlers: Array<{ __typename?: 'WizardBundler', id: string, type: SupportedBundlers, name: string }> }>, frameworks: Array<{ __typename?: 'WizardFrontendFramework', id: string, name: string, isSelected: boolean, type: FrontendFrameworkEnum }>, allBundlers: Array<{ __typename?: 'WizardBundler', id: string, name: string, type: SupportedBundlers }>, language: Maybe<{ __typename?: 'WizardCodeLanguage', id: string, name: string, isSelected: boolean, type: CodeLanguageEnum }>, allLanguages: Array<{ __typename?: 'WizardCodeLanguage', id: string, name: string, type: CodeLanguageEnum }> };

export type InitializeConfig_WizardStateFragment = { __typename?: 'Wizard', canNavigateForward: boolean, chosenTestingTypePluginsInitialized: boolean, step: WizardStep };

export type InitializeConfig_ConfigFragment = { __typename?: 'Query', wizard: { __typename?: 'Wizard', canNavigateForward: boolean, chosenTestingTypePluginsInitialized: boolean, step: WizardStep }, app: { __typename?: 'App', selectedBrowser: Maybe<{ __typename?: 'Browser', id: string, displayName: string }>, browsers: Maybe<Array<{ __typename?: 'Browser', id: string, name: string, family: BrowserFamily, disabled: boolean, isSelected: boolean, channel: string, displayName: string, path: string, version: string, majorVersion: Maybe<string> }>> } };

export type InitializeOpenProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type InitializeOpenProjectMutation = { __typename?: 'Mutation', initializeOpenProject: Maybe<boolean> };

export type InstallDependenciesFragment = { __typename?: 'Wizard', canNavigateForward: boolean, packagesToInstall: Maybe<Array<{ __typename?: 'WizardNpmPackage', id: string, name: string, description: string, package: string }>> };

export type ManualInstallFragment = { __typename?: 'Wizard', packagesToInstall: Maybe<Array<{ __typename?: 'WizardNpmPackage', id: string, name: string, description: string, package: string }>> };

export type OpenBrowserQueryVariables = Exact<{ [key: string]: never; }>;


export type OpenBrowserQuery = { __typename?: 'Query', app: { __typename?: 'App', selectedBrowser: Maybe<{ __typename?: 'Browser', id: string, displayName: string }>, browsers: Maybe<Array<{ __typename?: 'Browser', id: string, name: string, family: BrowserFamily, disabled: boolean, isSelected: boolean, channel: string, displayName: string, path: string, version: string, majorVersion: Maybe<string> }>> } };

export type LaunchOpenProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type LaunchOpenProjectMutation = { __typename?: 'Mutation', launchOpenProject: Maybe<boolean> };

export type OpenBrowserList_SetBrowserMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type OpenBrowserList_SetBrowserMutation = { __typename?: 'Mutation', launchpadSetBrowser: Maybe<boolean> };

export type OpenBrowserListFragment = { __typename?: 'App', selectedBrowser: Maybe<{ __typename?: 'Browser', id: string, displayName: string }>, browsers: Maybe<Array<{ __typename?: 'Browser', id: string, name: string, family: BrowserFamily, disabled: boolean, isSelected: boolean, channel: string, displayName: string, path: string, version: string, majorVersion: Maybe<string> }>> };

export type PackagesListFragment = { __typename?: 'Wizard', packagesToInstall: Maybe<Array<{ __typename?: 'WizardNpmPackage', id: string, name: string, description: string }>> };

export type TestingType_SelectMutationVariables = Exact<{
  input: WizardUpdateInput;
}>;


export type TestingType_SelectMutation = { __typename?: 'Mutation', wizardUpdate: Maybe<boolean> };

export type TestingTypeFragment = { __typename?: 'Wizard', testingTypes: Array<{ __typename?: 'TestingTypeInfo', id: string, type: TestingTypeEnum, title: string, description: string }> };

export type TestingTypeCardsFragment = { __typename?: 'Query', app: { __typename?: 'App', activeProject: Maybe<{ __typename?: 'Project', id: string, isFirstTimeCT: boolean, isFirstTimeE2E: boolean }> }, wizard: { __typename?: 'Wizard', testingTypes: Array<{ __typename?: 'TestingTypeInfo', id: string, type: TestingTypeEnum, title: string, description: string }> } };

export type TestingTypeSelectionMutationVariables = Exact<{
  input: WizardUpdateInput;
}>;


export type TestingTypeSelectionMutation = { __typename?: 'Mutation', wizardUpdate: Maybe<boolean> };

export type WizardFragment = { __typename?: 'Query', wizard: { __typename?: 'Wizard', title: Maybe<string>, description: Maybe<string>, step: WizardStep, testingType: Maybe<TestingTypeEnum>, canNavigateForward: boolean, chosenTestingTypePluginsInitialized: boolean, bundler: Maybe<{ __typename?: 'WizardBundler', id: string, name: string, type: SupportedBundlers, isSelected: Maybe<boolean> }>, framework: Maybe<{ __typename?: 'WizardFrontendFramework', type: FrontendFrameworkEnum, id: string, name: string, isSelected: boolean, supportedBundlers: Array<{ __typename?: 'WizardBundler', id: string, type: SupportedBundlers, name: string }> }>, frameworks: Array<{ __typename?: 'WizardFrontendFramework', id: string, name: string, isSelected: boolean, type: FrontendFrameworkEnum }>, allBundlers: Array<{ __typename?: 'WizardBundler', id: string, name: string, type: SupportedBundlers }>, language: Maybe<{ __typename?: 'WizardCodeLanguage', id: string, name: string, isSelected: boolean, type: CodeLanguageEnum }>, allLanguages: Array<{ __typename?: 'WizardCodeLanguage', id: string, name: string, type: CodeLanguageEnum }>, sampleConfigFiles: Maybe<Array<{ __typename?: 'WizardSampleConfigFile', id: string, filePath: string, content: string, status: WizardConfigFileStatusEnum, description: Maybe<string> }>>, packagesToInstall: Maybe<Array<{ __typename?: 'WizardNpmPackage', id: string, name: string, description: string, package: string }>> }, app: { __typename?: 'App', selectedBrowser: Maybe<{ __typename?: 'Browser', id: string, displayName: string }>, browsers: Maybe<Array<{ __typename?: 'Browser', id: string, name: string, family: BrowserFamily, disabled: boolean, isSelected: boolean, channel: string, displayName: string, path: string, version: string, majorVersion: Maybe<string> }>> } };

export type WizardHeaderFragment = { __typename?: 'Wizard', title: Maybe<string>, description: Maybe<string> };

export type WizardLayoutFragment = { __typename?: 'Wizard', title: Maybe<string>, description: Maybe<string>, step: WizardStep, canNavigateForward: boolean };

export type WizardLayoutNavigateMutationVariables = Exact<{
  input: WizardUpdateInput;
}>;


export type WizardLayoutNavigateMutation = { __typename?: 'Mutation', wizardUpdate: Maybe<boolean> };

export const LoginModalFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LoginModal"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloudViewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}}]}}]} as unknown as DocumentNode<LoginModalFragment, unknown>;
export const BaseErrorFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BaseError"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stack"}}]}}]} as unknown as DocumentNode<BaseErrorFragment, unknown>;
export const GlobalProjectCardFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GlobalProjectCard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"projectRoot"}},{"kind":"Field","name":{"kind":"Name","value":"cloudProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latestRun"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<GlobalProjectCardFragment, unknown>;
export const GlobalPageFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GlobalPage"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"App"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GlobalProjectCard"}}]}}]}},...GlobalProjectCardFragmentDoc.definitions]} as unknown as DocumentNode<GlobalPageFragment, unknown>;
export const TopNavFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopNav"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"App"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selectedBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}},{"kind":"Field","name":{"kind":"Name","value":"browsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}}]}}]} as unknown as DocumentNode<TopNavFragment, unknown>;
export const AuthFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Auth"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloudViewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}}]}}]} as unknown as DocumentNode<AuthFragment, unknown>;
export const HeaderBarFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HeaderBar"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TopNav"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"Auth"}}]}},...TopNavFragmentDoc.definitions,...AuthFragmentDoc.definitions]} as unknown as DocumentNode<HeaderBarFragment, unknown>;
export const SideBarItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SideBarItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NavigationItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"selected"}},{"kind":"Field","name":{"kind":"Name","value":"iconPath"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<SideBarItemFragment, unknown>;
export const RunIconFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RunIcon"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CloudRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]} as unknown as DocumentNode<RunIconFragment, unknown>;
export const RunResultsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RunResults"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CloudRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalPassed"}},{"kind":"Field","name":{"kind":"Name","value":"totalFailed"}},{"kind":"Field","name":{"kind":"Name","value":"totalPending"}},{"kind":"Field","name":{"kind":"Name","value":"totalSkipped"}},{"kind":"Field","name":{"kind":"Name","value":"totalDuration"}}]}}]} as unknown as DocumentNode<RunResultsFragment, unknown>;
export const RunCardFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RunCard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CloudRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RunIcon"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RunResults"}},{"kind":"Field","name":{"kind":"Name","value":"commitInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorEmail"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}}]}}]}},...RunIconFragmentDoc.definitions,...RunResultsFragmentDoc.definitions]} as unknown as DocumentNode<RunCardFragment, unknown>;
export const RunsPageFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RunsPage"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CloudProject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RunCard"}}]}}]}}]}},...RunCardFragmentDoc.definitions]} as unknown as DocumentNode<RunsPageFragment, unknown>;
export const ProjectIdFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectId"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}}]} as unknown as DocumentNode<ProjectIdFragment, unknown>;
export const RecordKeyFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RecordKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CloudRecordKey"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}}]}}]} as unknown as DocumentNode<RecordKeyFragment, unknown>;
export const OpenBrowserListFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OpenBrowserList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"App"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selectedBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"browsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"family"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}}]}}]} as unknown as DocumentNode<OpenBrowserListFragment, unknown>;
export const TestingTypeFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestingType"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testingTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<TestingTypeFragment, unknown>;
export const TestingTypeCardsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestingTypeCards"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isFirstTimeCT"}},{"kind":"Field","name":{"kind":"Name","value":"isFirstTimeE2E"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"wizard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testingTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<TestingTypeCardsFragment, unknown>;
export const EnvironmentSetupFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvironmentSetup"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}},{"kind":"Field","name":{"kind":"Name","value":"bundler"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}}]}},{"kind":"Field","name":{"kind":"Name","value":"framework"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"supportedBundlers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"frameworks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allBundlers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"language"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allLanguages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<EnvironmentSetupFragment, unknown>;
export const PackagesListFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PackagesList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"packagesToInstall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<PackagesListFragment, unknown>;
export const ManualInstallFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManualInstall"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"packagesToInstall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"package"}}]}}]}}]} as unknown as DocumentNode<ManualInstallFragment, unknown>;
export const InstallDependenciesFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InstallDependencies"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PackagesList"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManualInstall"}},{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}}]}},...PackagesListFragmentDoc.definitions,...ManualInstallFragmentDoc.definitions]} as unknown as DocumentNode<InstallDependenciesFragment, unknown>;
export const ConfigFilesFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ConfigFiles"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sampleConfigFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<ConfigFilesFragment, unknown>;
export const InitializeConfig_WizardStateFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InitializeConfig_WizardState"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}},{"kind":"Field","name":{"kind":"Name","value":"chosenTestingTypePluginsInitialized"}},{"kind":"Field","name":{"kind":"Name","value":"step"}}]}}]} as unknown as DocumentNode<InitializeConfig_WizardStateFragment, unknown>;
export const InitializeConfig_ConfigFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InitializeConfig_Config"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"InitializeConfig_WizardState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selectedBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"browsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"family"}},{"kind":"Field","name":{"kind":"Name","value":"disabled"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}}]}}]}},...InitializeConfig_WizardStateFragmentDoc.definitions]} as unknown as DocumentNode<InitializeConfig_ConfigFragment, unknown>;
export const WizardFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Wizard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"step"}},{"kind":"Field","name":{"kind":"Name","value":"testingType"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvironmentSetup"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"InstallDependencies"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ConfigFiles"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"InitializeConfig_Config"}}]}},...EnvironmentSetupFragmentDoc.definitions,...InstallDependenciesFragmentDoc.definitions,...ConfigFilesFragmentDoc.definitions,...InitializeConfig_ConfigFragmentDoc.definitions]} as unknown as DocumentNode<WizardFragment, unknown>;
export const WizardHeaderFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WizardHeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<WizardHeaderFragment, unknown>;
export const WizardLayoutFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WizardLayout"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"step"}},{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}}]}}]} as unknown as DocumentNode<WizardLayoutFragment, unknown>;
export const AppQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AppQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dev"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needsRelaunch"}}]}}]}}]} as unknown as DocumentNode<AppQueryQuery, AppQueryQueryVariables>;
export const App_DevRelaunchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"App_DevRelaunch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DevRelaunchAction"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devRelaunch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}]}]}}]} as unknown as DocumentNode<App_DevRelaunchMutation, App_DevRelaunchMutationVariables>;
export const MainLaunchpadQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MainLaunchpadQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestingTypeCards"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"Wizard"}},{"kind":"Field","name":{"kind":"Name","value":"baseError"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BaseError"}}]}},{"kind":"Field","name":{"kind":"Name","value":"wizard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"WizardHeader"}}]}},{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isInGlobalMode"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"GlobalPage"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HeaderBar"}}]}},...TestingTypeCardsFragmentDoc.definitions,...WizardFragmentDoc.definitions,...BaseErrorFragmentDoc.definitions,...WizardHeaderFragmentDoc.definitions,...GlobalPageFragmentDoc.definitions,...HeaderBarFragmentDoc.definitions]} as unknown as DocumentNode<MainLaunchpadQueryQuery, MainLaunchpadQueryQueryVariables>;
export const GlobalPage_AddProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPage_addProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"open"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}},{"kind":"Argument","name":{"kind":"Name","value":"open"},"value":{"kind":"Variable","name":{"kind":"Name","value":"open"}}}]}]}}]} as unknown as DocumentNode<GlobalPage_AddProjectMutation, GlobalPage_AddProjectMutationVariables>;
export const GlobalPage_RemoveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPage_RemoveProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}]}}]} as unknown as DocumentNode<GlobalPage_RemoveProjectMutation, GlobalPage_RemoveProjectMutationVariables>;
export const GlobalProjectCard_SetActiveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalProjectCard_setActiveProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setActiveProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}]}}]} as unknown as DocumentNode<GlobalProjectCard_SetActiveProjectMutation, GlobalProjectCard_SetActiveProjectMutationVariables>;
export const GlobalPageHeader_ClearActiveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPageHeader_clearActiveProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearActiveProject"}}]}}]} as unknown as DocumentNode<GlobalPageHeader_ClearActiveProjectMutation, GlobalPageHeader_ClearActiveProjectMutationVariables>;
export const LayoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Layout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"navigationMenu"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"selected"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"SideBarItem"}}]}}]}}]}},...SideBarItemFragmentDoc.definitions]} as unknown as DocumentNode<LayoutQuery, LayoutQueryVariables>;
export const NavigationMenuSetItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NavigationMenuSetItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NavItem"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"navigationMenuSetItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}]}]}}]} as unknown as DocumentNode<NavigationMenuSetItemMutation, NavigationMenuSetItemMutationVariables>;
export const ProjectSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectId"}},{"kind":"Field","name":{"kind":"Name","value":"cloudProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"recordKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RecordKey"}}]}}]}}]}}]}}]}},...ProjectIdFragmentDoc.definitions,...RecordKeyFragmentDoc.definitions]} as unknown as DocumentNode<ProjectSettingsQuery, ProjectSettingsQueryVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const BrowserOpenedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BrowserOpened"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}}]}}]} as unknown as DocumentNode<BrowserOpenedQuery, BrowserOpenedQueryVariables>;
export const ConfigFilesNavigateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfigFilesNavigate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ConfigFilesNavigateMutation, ConfigFilesNavigateMutationVariables>;
export const EnvironmentSetupSetFrameworkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentSetupSetFramework"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"framework"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FrontendFrameworkEnum"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetFramework"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"framework"},"value":{"kind":"Variable","name":{"kind":"Name","value":"framework"}}}]}]}}]} as unknown as DocumentNode<EnvironmentSetupSetFrameworkMutation, EnvironmentSetupSetFrameworkMutationVariables>;
export const EnvironmentSetupSetBundlerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentSetupSetBundler"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"bundler"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedBundlers"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetBundler"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"bundler"},"value":{"kind":"Variable","name":{"kind":"Name","value":"bundler"}}}]}]}}]} as unknown as DocumentNode<EnvironmentSetupSetBundlerMutation, EnvironmentSetupSetBundlerMutationVariables>;
export const EnvironmentSetupSetCodeLanguageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentSetupSetCodeLanguage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CodeLanguageEnum"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetCodeLanguage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}}]} as unknown as DocumentNode<EnvironmentSetupSetCodeLanguageMutation, EnvironmentSetupSetCodeLanguageMutationVariables>;
export const InitializeOpenProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitializeOpenProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initializeOpenProject"}}]}}]} as unknown as DocumentNode<InitializeOpenProjectMutation, InitializeOpenProjectMutationVariables>;
export const OpenBrowserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OpenBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OpenBrowserList"}}]}}]}},...OpenBrowserListFragmentDoc.definitions]} as unknown as DocumentNode<OpenBrowserQuery, OpenBrowserQueryVariables>;
export const LaunchOpenProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LaunchOpenProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"launchOpenProject"}}]}}]} as unknown as DocumentNode<LaunchOpenProjectMutation, LaunchOpenProjectMutationVariables>;
export const OpenBrowserList_SetBrowserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OpenBrowserList_SetBrowser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"launchpadSetBrowser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<OpenBrowserList_SetBrowserMutation, OpenBrowserList_SetBrowserMutationVariables>;
export const TestingType_SelectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestingType_Select"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<TestingType_SelectMutation, TestingType_SelectMutationVariables>;
export const TestingTypeSelectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestingTypeSelection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<TestingTypeSelectionMutation, TestingTypeSelectionMutationVariables>;
export const WizardLayoutNavigateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WizardLayoutNavigate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<WizardLayoutNavigateMutation, WizardLayoutNavigateMutationVariables>;