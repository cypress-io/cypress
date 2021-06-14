/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { CacheConfig, ConcreteRequest, FetchPolicy, IEnvironment, RenderPolicy, VariablesOf } from "relay-runtime";
import { EnvironmentProviderOptions, LoadQueryOptions, PreloadedQuery, loadQuery, useLazyLoadQuery, usePreloadedQuery, useQueryLoader } from "react-relay";

export type appQueryVariables = {};
export type appQueryResponse = {
    readonly app: {
        readonly options: {
            readonly os: string | null;
        } | null;
    } | null;
};
export type appQuery = {
    readonly response: appQueryResponse;
    readonly variables: appQueryVariables;
};



/*
query appQuery {
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
    "name": "appQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "appQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "f29d06af49c15cc0c847c93c42391cfe",
    "id": null,
    "metadata": {},
    "name": "appQuery",
    "operationKind": "query",
    "text": "query appQuery {\n  app {\n    options {\n      os\n    }\n  }\n}\n"
  }
};
})();
(node as any).hash = 'c3358f94c4f818d22687b9f0a6b6dcd5';

export default node;

export function loadAppQuery<TEnvironmentProviderOptions extends EnvironmentProviderOptions = {}>(
  environment: IEnvironment,
  variables: VariablesOf<appQuery> = {},
  options?: LoadQueryOptions,
  environmentProviderOptions?: TEnvironmentProviderOptions,
): PreloadedQuery<appQuery, TEnvironmentProviderOptions> {
  return loadQuery(environment, node, variables, options, environmentProviderOptions)
}
export function useAppQuery(variables: VariablesOf<appQuery> = {}, options?: {
  fetchKey?: string | number;
  fetchPolicy?: FetchPolicy;
  networkCacheConfig?: CacheConfig;
  UNSTABLE_renderPolicy?: RenderPolicy;
}) {
  return useLazyLoadQuery<appQuery>(node, variables, options)
}
export function useAppQueryLoader(initialQueryReference?: PreloadedQuery<appQuery> | null) {
  return useQueryLoader(node, initialQueryReference)
}
export function usePreloadedAppQuery(preloadedQuery: PreloadedQuery<appQuery>, options?: {
  UNSTABLE_renderPolicy?: RenderPolicy;
}) {
  return usePreloadedQuery<appQuery>(node, preloadedQuery, options)
}
