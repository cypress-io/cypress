import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'

export type Maybe<T> = T | null

export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}

export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> }

export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> }

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
}

export type CurrentStep = 'installDependencies' | 'selectFramework'

export type SpecType = 'component' | 'integration'

export type SpringboardAppQueryQueryVariables = Exact<{ [key: string]: never }>

export type SpringboardAppQueryQuery = {
  readonly __typename?: 'Query'
  readonly app: {
    readonly __typename?: 'App'
    readonly cypressVersion: Maybe<string>
  }
}

export type DependencyItemFragment = {
  readonly __typename?: 'WizardDependency'
  readonly packageName: Maybe<string>
  readonly description: Maybe<string>
}

export type InstallDependenciesFragment = {
  readonly __typename?: 'Wizard'
  readonly packageManager: Maybe<string>
  readonly dependenciesToInstall: Maybe<
    ReadonlyArray<
      Maybe<
        { readonly __typename?: 'WizardDependency' } & DependencyItemFragment
      >
    >
  >
}

export type SelectWizardQueryQueryVariables = Exact<{ [key: string]: never }>

export type SelectWizardQueryQuery = {
  readonly __typename?: 'Query'
  readonly app: {
    readonly __typename?: 'App'
    readonly cypressVersion: Maybe<string>
  }
  readonly wizard: Maybe<{
    readonly __typename?: 'Wizard'
    readonly showNewUserWelcome: Maybe<boolean>
  }>
}

export type DismissNewUserWelcomeMutationMutationVariables = Exact<{
  [key: string]: never
}>

export type DismissNewUserWelcomeMutationMutation = {
  readonly __typename?: 'Mutation'
  readonly wizardSetDismissedHelper: Maybe<{
    readonly __typename?: 'Wizard'
    readonly showNewUserWelcome: Maybe<boolean>
  }>
}

export const DependencyItemFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DependencyItem' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'WizardDependency' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'packageName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DependencyItemFragment, unknown>

export const InstallDependenciesFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'InstallDependencies' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Wizard' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'packageManager' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dependenciesToInstall' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DependencyItem' },
                },
              ],
            },
          },
        ],
      },
    },
    ...DependencyItemFragmentDoc.definitions,
  ],
} as unknown as DocumentNode<InstallDependenciesFragment, unknown>

export const SpringboardAppQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SpringboardAppQuery' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'app' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'cypressVersion' },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  SpringboardAppQueryQuery,
  SpringboardAppQueryQueryVariables
>

export const SelectWizardQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SelectWizardQuery' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'app' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'cypressVersion' },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'wizard' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'showNewUserWelcome' },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  SelectWizardQueryQuery,
  SelectWizardQueryQueryVariables
>

export const DismissNewUserWelcomeMutationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DismissNewUserWelcomeMutation' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'wizardSetDismissedHelper' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'showNewUserWelcome' },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  DismissNewUserWelcomeMutationMutation,
  DismissNewUserWelcomeMutationMutationVariables
>
