/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { CacheConfig, ConcreteRequest, FetchPolicy, IEnvironment, RenderPolicy, VariablesOf } from "relay-runtime";
import { EnvironmentProviderOptions, LoadQueryOptions, PreloadedQuery, loadQuery, useLazyLoadQuery, usePreloadedQuery, useQueryLoader } from "react-relay";

export type AppSpringboardQueryVariables = {};
export type AppSpringboardQueryResponse = {
    readonly app: {
        readonly cypressVersion: string | null;
    };
};
export type AppSpringboardQuery = {
    readonly response: AppSpringboardQueryResponse;
    readonly variables: AppSpringboardQueryVariables;
};



/*
query AppSpringboardQuery {
  app {
    cypressVersion
  }
}
*/

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "App",
    "kind": "LinkedField",
    "name": "app",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "cypressVersion",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "AppSpringboardQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "AppSpringboardQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "62ea69141c912948d124f0d7de18cfba",
    "id": null,
    "metadata": {},
    "name": "AppSpringboardQuery",
    "operationKind": "query",
    "text": "query AppSpringboardQuery {\n  app {\n    cypressVersion\n  }\n}\n"
  }
};
})();
(node as any).hash = '988aa42c699c823e9be5676c3b227667';

export default node;

export function loadAppSpringboardQuery<TEnvironmentProviderOptions extends EnvironmentProviderOptions = {}>(
  environment: IEnvironment,
  variables: VariablesOf<AppSpringboardQuery> = {},
  options?: LoadQueryOptions,
  environmentProviderOptions?: TEnvironmentProviderOptions,
): PreloadedQuery<AppSpringboardQuery, TEnvironmentProviderOptions> {
  return loadQuery(environment, node, variables, options, environmentProviderOptions)
}
export function useAppSpringboardQuery(variables: VariablesOf<AppSpringboardQuery> = {}, options?: {
  fetchKey?: string | number;
  fetchPolicy?: FetchPolicy;
  networkCacheConfig?: CacheConfig;
  UNSTABLE_renderPolicy?: RenderPolicy;
}) {
  return useLazyLoadQuery<AppSpringboardQuery>(node, variables, options)
}
export function useAppSpringboardQueryLoader(initialQueryReference?: PreloadedQuery<AppSpringboardQuery> | null) {
  return useQueryLoader(node, initialQueryReference)
}
export function usePreloadedAppSpringboardQuery(preloadedQuery: PreloadedQuery<AppSpringboardQuery>, options?: {
  UNSTABLE_renderPolicy?: RenderPolicy;
}) {
  return usePreloadedQuery<AppSpringboardQuery>(node, preloadedQuery, options)
}
