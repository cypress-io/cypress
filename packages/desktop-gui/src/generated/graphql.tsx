import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'

export type Maybe<T> = T | null;

export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};

export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };

export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: any
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any
};

export type CurrentStep = 'installDependencies' | 'selectFramework';

export type SpecType = 'component' | 'integration';

export type BrowserState = 'closed' | 'opened' | 'opening';

export type AppQueryQueryVariables = Exact<{ [key: string]: never }>;

export type AppQueryQuery = {
  readonly __typename?: 'Query'
  readonly app: {
    readonly __typename?: 'App'
    readonly cypressVersion: Maybe<string>
  }
  readonly currentProject: Maybe<
    {
      readonly __typename?: 'Project'
      readonly id: Maybe<string>
    } & ActiveProjectFragment
  >
  readonly recentProjects: Maybe<
    ReadonlyArray<
      Maybe<{ readonly __typename?: 'Project' } & ProjectListItemFragment>
    >
  >
};

export type BrowserDropdownFragment = {
  readonly __typename?: 'Project'
  readonly browserState: Maybe<BrowserState>
  readonly browsers: Maybe<
    ReadonlyArray<
      Maybe<{ readonly __typename?: 'Browser', readonly id: Maybe<string> }>
    >
  >
};

export type ActiveProjectFragment = {
  readonly __typename?: 'Project'
  readonly displayName: Maybe<string>
  readonly displayPath: Maybe<string>
} & BrowserDropdownFragment &
  SpecsListFragment;

export type ProjectListItemFragment = {
  readonly __typename?: 'Project'
  readonly id: Maybe<string>
  readonly relativePath: string
  readonly displayName: Maybe<string>
  readonly displayPath: Maybe<string>
};

export type RemoveProjectMutationVariables = Exact<{
  projectId: Scalars['ID']
}>;

export type RemoveProjectMutation = {
  readonly __typename?: 'Mutation'
  readonly removeProject: Maybe<{
    readonly __typename?: 'App'
    readonly recentProjects: Maybe<
      ReadonlyArray<
        Maybe<{ readonly __typename?: 'Project' } & ProjectListItemFragment>
      >
    >
  }>
};

export type SelectProjectMutationVariables = Exact<{
  projectId: Scalars['ID']
}>;

export type SelectProjectMutation = {
  readonly __typename?: 'Mutation'
  readonly selectProject: Maybe<{
    readonly __typename?: 'Query'
    readonly currentProject: Maybe<{
      readonly __typename?: 'Project'
      readonly id: Maybe<string>
    }>
  }>
};

export type SettingsFragment = {
  readonly __typename?: 'App'
  readonly cypressVersion: Maybe<string>
  readonly options: Maybe<{
    readonly __typename?: 'AppOptions'
    readonly proxyServer: Maybe<string>
  }>
};

export type SpecsListFragment = {
  readonly __typename?: 'Project'
  readonly browserState: Maybe<BrowserState>
  readonly integrationFolder: Maybe<string>
  readonly sortedSpecsList: Maybe<
    ReadonlyArray<
      Maybe<{ readonly __typename?: 'File', readonly id: Maybe<string> }>
    >
  >
};

export const BrowserDropdownFragmentDoc = ({
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'BrowserDropdown' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Project' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'browserState' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'browsers' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown) as DocumentNode<BrowserDropdownFragment, unknown>

export const SpecsListFragmentDoc = ({
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'SpecsList' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Project' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'browserState' } },
          { kind: 'Field', name: { kind: 'Name', value: 'integrationFolder' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sortedSpecsList' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown) as DocumentNode<SpecsListFragment, unknown>

export const ActiveProjectFragmentDoc = ({
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ActiveProject' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Project' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayPath' } },
          {
            kind: 'FragmentSpread',
            name: { kind: 'Name', value: 'BrowserDropdown' },
          },
          {
            kind: 'FragmentSpread',
            name: { kind: 'Name', value: 'SpecsList' },
          },
        ],
      },
    },
    ...BrowserDropdownFragmentDoc.definitions,
    ...SpecsListFragmentDoc.definitions,
  ],
} as unknown) as DocumentNode<ActiveProjectFragment, unknown>

export const ProjectListItemFragmentDoc = ({
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ProjectListItem' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Project' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'relativePath' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayPath' } },
        ],
      },
    },
  ],
} as unknown) as DocumentNode<ProjectListItemFragment, unknown>

export const SettingsFragmentDoc = ({
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'Settings' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'App' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'cypressVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'options' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'proxyServer' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown) as DocumentNode<SettingsFragment, unknown>

export const AppQueryDocument = ({
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AppQuery' },
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
            name: { kind: 'Name', value: 'currentProject' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'ActiveProject' },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'recentProjects' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'ProjectListItem' },
                },
              ],
            },
          },
        ],
      },
    },
    ...ActiveProjectFragmentDoc.definitions,
    ...ProjectListItemFragmentDoc.definitions,
  ],
} as unknown) as DocumentNode<AppQueryQuery, AppQueryQueryVariables>

export const RemoveProjectDocument = ({
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveProject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'projectId' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removeProject' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'projectId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'recentProjects' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'FragmentSpread',
                        name: { kind: 'Name', value: 'ProjectListItem' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    ...ProjectListItemFragmentDoc.definitions,
  ],
} as unknown) as DocumentNode<
  RemoveProjectMutation,
  RemoveProjectMutationVariables
>

export const SelectProjectDocument = ({
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SelectProject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'projectId' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'selectProject' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'projectId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'currentProject' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown) as DocumentNode<
  SelectProjectMutation,
  SelectProjectMutationVariables
>
