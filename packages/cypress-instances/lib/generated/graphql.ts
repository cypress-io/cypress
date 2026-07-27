/* eslint-disable */
type Maybe<T> = T | null;
type InputMaybe<T> = Maybe<T>;
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };

export type TapSpecsQueryVariables = Exact<{ [key: string]: never; }>;


export type TapSpecsQuery = { readonly __typename?: 'Query', readonly currentProject: { readonly __typename?: 'CurrentProject', readonly specs: ReadonlyArray<{ readonly __typename?: 'Spec', readonly relative: string, readonly gitInfo: { readonly __typename?: 'GitInfo', readonly lastModifiedHumanReadable: string | null, readonly lastModifiedTimestamp: string | null } | null }> } | null };
