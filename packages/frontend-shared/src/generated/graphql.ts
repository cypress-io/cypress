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
  | 'integration'
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

export type AuthFragment = { readonly __typename?: 'Query', readonly cloudViewer: Maybe<{ readonly __typename?: 'CloudUser', readonly id: string, readonly email: Maybe<string>, readonly fullName: Maybe<string> }>, readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { readonly __typename?: 'Mutation', readonly logout: Maybe<boolean> };

export type LoginMutationVariables = Exact<{ [key: string]: never; }>;


export type LoginMutation = { readonly __typename?: 'Mutation', readonly login: Maybe<boolean> };

export type BrowserOpenedQueryVariables = Exact<{ [key: string]: never; }>;


export type BrowserOpenedQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean } };

export type GlobalPageHeader_ClearActiveProjectMutationVariables = Exact<{ [key: string]: never; }>;


export type GlobalPageHeader_ClearActiveProjectMutation = { readonly __typename?: 'Mutation', readonly clearActiveProject: Maybe<boolean> };

export type HeaderBarFragment = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean, readonly activeProject: Maybe<{ readonly __typename?: 'Project', readonly id: string, readonly title: string }>, readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string, readonly majorVersion: Maybe<string> }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly isSelected: boolean, readonly displayName: string, readonly version: string, readonly majorVersion: Maybe<string> }>> }, readonly cloudViewer: Maybe<{ readonly __typename?: 'CloudUser', readonly id: string, readonly email: Maybe<string>, readonly fullName: Maybe<string> }> };

export type HeaderBar_HeaderBarQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type HeaderBar_HeaderBarQueryQuery = { readonly __typename?: 'Query', readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean, readonly activeProject: Maybe<{ readonly __typename?: 'Project', readonly id: string, readonly title: string }>, readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string, readonly majorVersion: Maybe<string> }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly isSelected: boolean, readonly displayName: string, readonly version: string, readonly majorVersion: Maybe<string> }>> }, readonly cloudViewer: Maybe<{ readonly __typename?: 'CloudUser', readonly id: string, readonly email: Maybe<string>, readonly fullName: Maybe<string> }> };

export type LoginModalFragment = { readonly __typename?: 'Query', readonly cloudViewer: Maybe<{ readonly __typename?: 'CloudUser', readonly id: string, readonly email: Maybe<string>, readonly fullName: Maybe<string> }>, readonly app: { readonly __typename?: 'App', readonly isAuthBrowserOpened: boolean } };

export type TopNavFragment = { readonly __typename?: 'App', readonly activeProject: Maybe<{ readonly __typename?: 'Project', readonly id: string }>, readonly selectedBrowser: Maybe<{ readonly __typename?: 'Browser', readonly id: string, readonly displayName: string, readonly majorVersion: Maybe<string> }>, readonly browsers: Maybe<ReadonlyArray<{ readonly __typename?: 'Browser', readonly id: string, readonly isSelected: boolean, readonly displayName: string, readonly version: string, readonly majorVersion: Maybe<string> }>> };


export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const BrowserOpenedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BrowserOpened"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}}]}}]} as unknown as DocumentNode<BrowserOpenedQuery, BrowserOpenedQueryVariables>;
export const GlobalPageHeader_ClearActiveProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GlobalPageHeader_clearActiveProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearActiveProject"}}]}}]} as unknown as DocumentNode<GlobalPageHeader_ClearActiveProjectMutation, GlobalPageHeader_ClearActiveProjectMutationVariables>;
export const HeaderBar_HeaderBarQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HeaderBar_HeaderBarQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeProject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"selectedBrowser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}},{"kind":"Field","name":{"kind":"Name","value":"browsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isSelected"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"majorVersion"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isAuthBrowserOpened"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloudViewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}}]}}]} as unknown as DocumentNode<HeaderBar_HeaderBarQueryQuery, HeaderBar_HeaderBarQueryQueryVariables>;