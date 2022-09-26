# GraphQL

The GraphQL layer that `@packages/launchpad` and `@packages/app` use to interact with `@packages/server`. 

With the goal of type safety, several tools and abstractions are used. The technologies are:

- [nexus-graphql](https://nexusjs.org/) library for generating GraphQL schema using TypeScript objects
- [graphql-code-generator](https://www.graphql-code-generator.com/) generate TypeScript types from `gql` queries (for front-end consuming the API)

[This tutorial](https://github.com/lmiller1990/vue-3-urql-example) demonstrates how to build a type-safe GraphQL app using the above technologies. It's a good place to start, to learn how and why each tool is used.

## Development

You will generally develop this in parallel with a front-end, in this case `@packages/launchpad`. Run `yarn dev` in `@packages/launchpad` and it will start up the GraphQL server. This also re-generates the `graphql.schema` file based on the declarations inside of [entities](https://github.com/cypress-io/cypress/blob/develop/packages/graphql/src/entities). 

Visit `http://localhost:52200/graphql` for the GraphiQL interface.

![graphql](./gql.png)

You can also develop in a test-driven manner using the tests.

- `yarn test-unit` for the unit tests
- `yarn test-integration` for the integration tests

## Debugging

Logs available at `cypress-verbose:graphql:*` namespaces `{fields,operation}`


