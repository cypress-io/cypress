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





export type WizardCodeLanguage =
  | 'js'
  | 'ts';


export type WizardNavigateDirection =
  | 'back'
  | 'forward';


export type WizardStep =
  | 'createConfig'
  | 'initializePlugins'
  | 'installDependencies'
  | 'selectFramework'
  | 'setupComplete'
  | 'welcome';

export type AppQueryVariables = Exact<{ [key: string]: never; }>;


export type AppQuery = { readonly __typename?: 'Query', readonly app: (
    { readonly __typename?: 'App' }
    & FooFragment
  ) };

export type FooFragment = { readonly __typename?: 'App', readonly healthCheck: string };

export const FooFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Foo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"App"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"healthCheck"}}]}}]} as unknown as DocumentNode<FooFragment, unknown>;
export const AppDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"App"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Foo"}}]}}]}},...FooFragmentDoc.definitions]} as unknown as DocumentNode<AppQuery, AppQueryVariables>;