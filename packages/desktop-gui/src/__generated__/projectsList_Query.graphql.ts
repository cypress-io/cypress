/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { CacheConfig, ConcreteRequest, FetchPolicy, IEnvironment, RenderPolicy, VariablesOf } from "relay-runtime";
import { EnvironmentProviderOptions, LoadQueryOptions, PreloadedQuery, loadQuery, useLazyLoadQuery, usePreloadedQuery, useQueryLoader } from "react-relay";

export type projectsList_QueryVariables = {};
export type projectsList_QueryResponse = {
    readonly app: {
        readonly options: {
            readonly os: string | null;
        } | null;
    } | null;
};
export type projectsList_Query = {
    readonly response: projectsList_QueryResponse;
    readonly variables: projectsList_QueryVariables;
};



/*
query projectsList_Query {
  app {
    options {
      os
    }
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
        "concreteType": "AppOptions",
        "kind": "LinkedField",
        "name": "options",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "os",
            "storageKey": null
          }
        ],
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
    "name": "projectsList_Query",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "projectsList_Query",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "67798b169f48c23f282f17ff0d8632e7",
    "id": null,
    "metadata": {},
    "name": "projectsList_Query",
    "operationKind": "query",
    "text": "query projectsList_Query {\n  app {\n    options {\n      os\n    }\n  }\n}\n"
  }
};
})();
(node as any).hash = '21b89b134fdb5559039982dbad59c0de';

export default node;

export function loadProjectsList_Query<TEnvironmentProviderOptions extends EnvironmentProviderOptions = {}>(
  environment: IEnvironment,
  variables: VariablesOf<projectsList_Query> = {},
  options?: LoadQueryOptions,
  environmentProviderOptions?: TEnvironmentProviderOptions,
): PreloadedQuery<projectsList_Query, TEnvironmentProviderOptions> {
  return loadQuery(environment, node, variables, options, environmentProviderOptions)
}
export function useProjectsList_Query(variables: VariablesOf<projectsList_Query> = {}, options?: {
  fetchKey?: string | number;
  fetchPolicy?: FetchPolicy;
  networkCacheConfig?: CacheConfig;
  UNSTABLE_renderPolicy?: RenderPolicy;
}) {
  return useLazyLoadQuery<projectsList_Query>(node, variables, options)
}
export function useProjectsList_QueryLoader(initialQueryReference?: PreloadedQuery<projectsList_Query> | null) {
  return useQueryLoader(node, initialQueryReference)
}
export function usePreloadedProjectsList_Query(preloadedQuery: PreloadedQuery<projectsList_Query>, options?: {
  UNSTABLE_renderPolicy?: RenderPolicy;
}) {
  return usePreloadedQuery<projectsList_Query>(node, preloadedQuery, options)
}
