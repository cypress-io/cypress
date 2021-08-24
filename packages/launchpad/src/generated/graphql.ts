/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
};



export type BrowserFamily =
  | 'chromium'
  | 'firefox';



export type FrontendFramework =
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




export type ResolvedConfigOption =
  | 'config'
  | 'default'
  | 'env'
  | 'plugin'
  | 'runtime';






export type ResolvedType =
  | 'array'
  | 'boolean'
  | 'json'
  | 'number'
  | 'string';



export type RunGroupStatus =
  | 'cancelled'
  | 'errored'
  | 'failed'
  | 'noTests'
  | 'passed'
  | 'running'
  | 'timedOut'
  | 'unclaimed';

/** The bundlers that we can use with Cypress */
export type SupportedBundlers =
  | 'vite'
  | 'webpack';

export type TestingTypeEnum =
  | 'component'
  | 'e2e';





export type WizardCodeLanguage =
  | 'js'
  | 'ts';


export type WizardNavigateDirection =
  | 'back'
  | 'forward';


export type WizardStep =
  | 'createConfig'
  | 'installDependencies'
  | 'selectFramework'
  | 'setupComplete'
  | 'welcome';

export type LayoutQueryVariables = Exact<{ [key: string]: never; }>;


export type LayoutQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly activeProject: Maybe<{ readonly __typename?: 'LocalProject', readonly title: string }> }, readonly navigationMenu: Maybe<{ readonly __typename?: 'NavigationMenu', readonly items: ReadonlyArray<Maybe<{ readonly __typename?: 'NavigationItem', readonly id: NavItem, readonly name: string, readonly selected: boolean, readonly iconPath: string }>> }> };

export type NavigationMenuSetItemMutationVariables = Exact<{
  type: NavItem;
}>;


export type NavigationMenuSetItemMutation = { readonly __typename?: 'Mutation', readonly navigationMenuSetItem: Maybe<{ readonly __typename?: 'NavigationMenu', readonly items: ReadonlyArray<Maybe<{ readonly __typename?: 'NavigationItem', readonly name: string, readonly selected: boolean }>> }> };

export type RunFragment = { readonly __typename?: 'RunGroup', readonly createdAt: string, readonly totalPassed: Maybe<number>, readonly totalFailed: Maybe<number>, readonly totalPending: Maybe<number>, readonly totalSkipped: Maybe<number>, readonly totalDuration: Maybe<number>, readonly status: RunGroupStatus, readonly commit: { readonly __typename?: 'RunCommit', readonly authorName: string, readonly authorEmail: string, readonly message: string, readonly branch: string } };

export type RunPageRootQueryVariables = Exact<{ [key: string]: never; }>;


export type RunPageRootQuery = { readonly __typename?: 'Query', readonly viewer: Maybe<(
    { readonly __typename?: 'Viewer', readonly getProjectByProjectId: Maybe<{ readonly __typename?: 'DashboardProject', readonly runs: Maybe<ReadonlyArray<(
        { readonly __typename?: 'RunGroup' }
        & RunFragment
      )>> }> }
    & AuthenticateFragment
  )> };

export type ProjectIdFragment = { readonly __typename?: 'LocalProject', readonly projectId: Maybe<string> };

export type ProjectSettingsQueryVariables = Exact<{
  projectId: Scalars['String'];
}>;


export type ProjectSettingsQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly activeProject: Maybe<(
      { readonly __typename?: 'LocalProject' }
      & ProjectIdFragment
    )> }, readonly viewer: Maybe<{ readonly __typename?: 'Viewer', readonly getProjectByProjectId: Maybe<{ readonly __typename?: 'DashboardProject', readonly recordKeys: Maybe<ReadonlyArray<string>> }> }> };

export type AuthenticateFragment = { readonly __typename?: 'Viewer', readonly email: string, readonly authToken: string };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { readonly __typename?: 'Mutation', readonly logout: Maybe<(
    { readonly __typename?: 'Viewer' }
    & AuthenticateFragment
  )> };

export type LoginMutationVariables = Exact<{ [key: string]: never; }>;


export type LoginMutation = { readonly __typename?: 'Mutation', readonly login: Maybe<(
    { readonly __typename?: 'Viewer' }
    & AuthenticateFragment
  )> };

export type AuthQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthQuery = { readonly __typename?: 'Query', readonly viewer: Maybe<(
    { readonly __typename?: 'Viewer' }
    & AuthenticateFragment
  )> };

export type ConfigFileFragment = { readonly __typename?: 'Wizard', readonly canNavigateForward: boolean, readonly sampleCodeJs: Maybe<string>, readonly sampleCodeTs: Maybe<string> };

export type ProjectRootFragment = { readonly __typename?: 'App', readonly activeProject: Maybe<{ readonly __typename?: 'LocalProject', readonly projectRoot: string }> };

export type AppCreateConfigFileMutationVariables = Exact<{
  code: Scalars['String'];
  configFilename: Scalars['String'];
}>;


export type AppCreateConfigFileMutation = { readonly __typename?: 'Mutation', readonly appCreateConfigFile: Maybe<{ readonly __typename?: 'App', readonly activeProject: Maybe<{ readonly __typename?: 'LocalProject', readonly projectRoot: string }> }> };

export type EnvironmentSetupSetFrameworkMutationVariables = Exact<{
  framework: FrontendFramework;
}>;


export type EnvironmentSetupSetFrameworkMutation = { readonly __typename?: 'Mutation', readonly wizardSetFramework: Maybe<(
    { readonly __typename?: 'Wizard' }
    & EnvironmentSetupFragment
  )> };

export type EnvironmentSetupSetBundlerMutationVariables = Exact<{
  bundler: SupportedBundlers;
}>;


export type EnvironmentSetupSetBundlerMutation = { readonly __typename?: 'Mutation', readonly wizardSetBundler: Maybe<(
    { readonly __typename?: 'Wizard' }
    & EnvironmentSetupFragment
  )> };

export type EnvironmentSetupFragment = { readonly __typename?: 'Wizard', readonly canNavigateForward: boolean, readonly bundler: Maybe<{ readonly __typename?: 'WizardBundler', readonly id: SupportedBundlers, readonly name: string }>, readonly framework: Maybe<{ readonly __typename?: 'WizardFrontendFramework', readonly id: FrontendFramework, readonly name: string, readonly supportedBundlers: ReadonlyArray<{ readonly __typename?: 'WizardBundler', readonly id: SupportedBundlers, readonly name: string }> }>, readonly frameworks: ReadonlyArray<{ readonly __typename?: 'WizardFrontendFramework', readonly id: FrontendFramework, readonly name: string, readonly isSelected: boolean }>, readonly allBundlers: ReadonlyArray<{ readonly __typename?: 'WizardBundler', readonly id: SupportedBundlers, readonly name: string }> };

export type InstallDependenciesFragment = (
  { readonly __typename?: 'Wizard', readonly isManualInstall: boolean, readonly canNavigateForward: boolean }
  & PackagesListFragment
  & ManualInstallFragment
);

export type InstallDependenciesManualInstallMutationVariables = Exact<{
  isManual: Scalars['Boolean'];
}>;


export type InstallDependenciesManualInstallMutation = { readonly __typename?: 'Mutation', readonly wizardSetManualInstall: Maybe<(
    { readonly __typename?: 'Wizard' }
    & InstallDependenciesFragment
  )> };

export type ManualInstallFragment = { readonly __typename?: 'Wizard', readonly packagesToInstall: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardNpmPackage', readonly name: string, readonly description: string }>> };

export type PackagesListFragment = { readonly __typename?: 'Wizard', readonly packagesToInstall: Maybe<ReadonlyArray<{ readonly __typename?: 'WizardNpmPackage', readonly name: string, readonly description: string }>> };

export type TestingTypeSelectMutationVariables = Exact<{
  testingType: TestingTypeEnum;
}>;


export type TestingTypeSelectMutation = { readonly __typename?: 'Mutation', readonly wizardSetTestingType: Maybe<{ readonly __typename?: 'Wizard', readonly step: WizardStep, readonly testingType: Maybe<TestingTypeEnum>, readonly title: Maybe<string>, readonly description: Maybe<string> }> };

export type TestingTypeFragment = { readonly __typename?: 'Wizard', readonly testingTypes: Maybe<ReadonlyArray<{ readonly __typename?: 'TestingTypeInfo', readonly id: TestingTypeEnum, readonly title: Maybe<string>, readonly description: Maybe<string> }>> };

export type RootQueryVariables = Exact<{ [key: string]: never; }>;


export type RootQuery = { readonly __typename?: 'Query', readonly app: (
    { readonly __typename?: 'App', readonly isFirstOpen: boolean }
    & ProjectRootFragment
  ), readonly wizard: Maybe<(
    { readonly __typename?: 'Wizard', readonly step: WizardStep, readonly title: Maybe<string>, readonly description: Maybe<string>, readonly testingType: Maybe<TestingTypeEnum> }
    & TestingTypeFragment
    & ConfigFileFragment
    & InstallDependenciesFragment
    & EnvironmentSetupFragment
  )> };

export type InitializeOpenProjectMutationVariables = Exact<{
  testingType: TestingTypeEnum;
}>;


export type InitializeOpenProjectMutation = { readonly __typename?: 'Mutation', readonly initializeOpenProject: Maybe<{ readonly __typename?: 'App', readonly projects: ReadonlyArray<{ readonly __typename: 'LocalProject' }> }> };

export type LaunchOpenProjectMutationVariables = Exact<{
  testingType: TestingTypeEnum;
}>;


export type LaunchOpenProjectMutation = { readonly __typename?: 'Mutation', readonly launchOpenProject: Maybe<{ readonly __typename?: 'App', readonly projects: ReadonlyArray<{ readonly __typename: 'LocalProject' }> }> };

export type WizardLayoutFragment = { readonly __typename?: 'Wizard', readonly step: WizardStep, readonly canNavigateForward: boolean };

export type WizardLayoutNavigateMutationVariables = Exact<{
  direction: WizardNavigateDirection;
}>;


export type WizardLayoutNavigateMutation = { readonly __typename?: 'Mutation', readonly wizardNavigate: Maybe<(
    { readonly __typename?: 'Wizard' }
    & WizardLayoutFragment
  )> };

export const RunFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Run"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RunGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalPassed"}},{"kind":"Field","name":{"kind":"Name","value":"totalFailed"}},{"kind":"Field","name":{"kind":"Name","value":"totalPending"}},{"kind":"Field","name":{"kind":"Name","value":"totalSkipped"}},{"kind":"Field","name":{"kind":"Name","value":"totalDuration"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"commit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"authorEmail"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}}]}}]}}]} as unknown as DocumentNode<RunFragment, unknown>;
export const ProjectIdFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectId"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LocalProject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}}]} as unknown as DocumentNode<ProjectIdFragment, unknown>;
export const AuthenticateFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Authenticate"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Viewer"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"authToken"}}]}}]} as unknown as DocumentNode<AuthenticateFragment, unknown>;
export const ConfigFileFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ConfigFile"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}},{"kind":"Field","alias":{"kind":"Name","value":"sampleCodeJs"},"name":{"kind":"Name","value":"sampleCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"lang"},"value":{"kind":"EnumValue","value":"js"}}]},{"kind":"Field","alias":{"kind":"Name","value":"sampleCodeTs"},"name":{"kind":"Name","value":"sampleCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"lang"},"value":{"kind":"EnumValue","value":"ts"}}]}]}}]} as unknown as DocumentNode<ConfigFileFragment, unknown>;
export const ProjectRootFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProjectRoot"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"App"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectRoot"}}]}}]}}]} as unknown as DocumentNode<ProjectRootFragment, unknown>;
export const EnvironmentSetupFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvironmentSetup"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}},{"kind":"Field","name":{"kind":"Name","value":"bundler"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"framework"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"supportedBundlers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"frameworks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allBundlers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EnvironmentSetupFragment, unknown>;
export const PackagesListFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PackagesList"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"packagesToInstall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<PackagesListFragment, unknown>;
export const ManualInstallFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManualInstall"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"packagesToInstall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<ManualInstallFragment, unknown>;
export const InstallDependenciesFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InstallDependencies"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PackagesList"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManualInstall"}},{"kind":"Field","name":{"kind":"Name","value":"isManualInstall"}},{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}}]}},...PackagesListFragmentDoc.definitions,...ManualInstallFragmentDoc.definitions]} as unknown as DocumentNode<InstallDependenciesFragment, unknown>;
export const TestingTypeFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestingType"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testingTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<TestingTypeFragment, unknown>;
export const WizardLayoutFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WizardLayout"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Wizard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"step"}},{"kind":"Field","name":{"kind":"Name","value":"canNavigateForward"}}]}}]} as unknown as DocumentNode<WizardLayoutFragment, unknown>;
export const LayoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Layout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"navigationMenu"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"selected"}},{"kind":"Field","name":{"kind":"Name","value":"iconPath"}}]}}]}}]}}]} as unknown as DocumentNode<LayoutQuery, LayoutQueryVariables>;
export const NavigationMenuSetItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NavigationMenuSetItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NavItem"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"navigationMenuSetItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"selected"}}]}}]}}]}}]} as unknown as DocumentNode<NavigationMenuSetItemMutation, NavigationMenuSetItemMutationVariables>;
export const RunPageRootDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RunPageRoot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Authenticate"}},{"kind":"Field","name":{"kind":"Name","value":"getProjectByProjectId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"StringValue","value":"ypt4pf","block":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Run"}}]}}]}}]}}]}},...AuthenticateFragmentDoc.definitions,...RunFragmentDoc.definitions]} as unknown as DocumentNode<RunPageRootQuery, RunPageRootQueryVariables>;
export const ProjectSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getProjectByProjectId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordKeys"}}]}}]}}]}},...ProjectIdFragmentDoc.definitions]} as unknown as DocumentNode<ProjectSettingsQuery, ProjectSettingsQueryVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Authenticate"}}]}}]}},...AuthenticateFragmentDoc.definitions]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Authenticate"}}]}}]}},...AuthenticateFragmentDoc.definitions]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const AuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Auth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Authenticate"}}]}}]}},...AuthenticateFragmentDoc.definitions]} as unknown as DocumentNode<AuthQuery, AuthQueryVariables>;
export const AppCreateConfigFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"appCreateConfigFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"configFilename"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appCreateConfigFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"configFilename"},"value":{"kind":"Variable","name":{"kind":"Name","value":"configFilename"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectRoot"}}]}}]}}]}}]} as unknown as DocumentNode<AppCreateConfigFileMutation, AppCreateConfigFileMutationVariables>;
export const EnvironmentSetupSetFrameworkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentSetupSetFramework"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"framework"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FrontendFramework"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetFramework"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"framework"},"value":{"kind":"Variable","name":{"kind":"Name","value":"framework"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvironmentSetup"}}]}}]}},...EnvironmentSetupFragmentDoc.definitions]} as unknown as DocumentNode<EnvironmentSetupSetFrameworkMutation, EnvironmentSetupSetFrameworkMutationVariables>;
export const EnvironmentSetupSetBundlerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnvironmentSetupSetBundler"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"bundler"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedBundlers"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetBundler"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"bundler"},"value":{"kind":"Variable","name":{"kind":"Name","value":"bundler"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvironmentSetup"}}]}}]}},...EnvironmentSetupFragmentDoc.definitions]} as unknown as DocumentNode<EnvironmentSetupSetBundlerMutation, EnvironmentSetupSetBundlerMutationVariables>;
export const InstallDependenciesManualInstallDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InstallDependenciesManualInstall"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isManual"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetManualInstall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"isManual"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isManual"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"InstallDependencies"}}]}}]}},...InstallDependenciesFragmentDoc.definitions]} as unknown as DocumentNode<InstallDependenciesManualInstallMutation, InstallDependenciesManualInstallMutationVariables>;
export const TestingTypeSelectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestingTypeSelect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestingTypeEnum"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardSetTestingType"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"step"}},{"kind":"Field","name":{"kind":"Name","value":"testingType"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<TestingTypeSelectMutation, TestingTypeSelectMutationVariables>;
export const RootDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Root"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isFirstOpen"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProjectRoot"}}]}},{"kind":"Field","name":{"kind":"Name","value":"wizard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"step"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"testingType"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestingType"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ConfigFile"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"InstallDependencies"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvironmentSetup"}}]}}]}},...ProjectRootFragmentDoc.definitions,...TestingTypeFragmentDoc.definitions,...ConfigFileFragmentDoc.definitions,...InstallDependenciesFragmentDoc.definitions,...EnvironmentSetupFragmentDoc.definitions]} as unknown as DocumentNode<RootQuery, RootQueryVariables>;
export const InitializeOpenProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitializeOpenProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestingTypeEnum"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initializeOpenProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"testingType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]}}]} as unknown as DocumentNode<InitializeOpenProjectMutation, InitializeOpenProjectMutationVariables>;
export const LaunchOpenProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LaunchOpenProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestingTypeEnum"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"launchOpenProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"testingType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"testingType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]}}]} as unknown as DocumentNode<LaunchOpenProjectMutation, LaunchOpenProjectMutationVariables>;
export const WizardLayoutNavigateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WizardLayoutNavigate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"direction"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WizardNavigateDirection"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wizardNavigate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"direction"},"value":{"kind":"Variable","name":{"kind":"Name","value":"direction"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WizardLayout"}}]}}]}},...WizardLayoutFragmentDoc.definitions]} as unknown as DocumentNode<WizardLayoutNavigateMutation, WizardLayoutNavigateMutationVariables>;