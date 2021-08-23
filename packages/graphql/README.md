# GraphQL

The GraphQL layer that `@packages/launchpad` and `@packages/runner` use to interact with `@packages/server`. 

With the goal of type safety, several tools and abstractions are used. The technologies are:

- [nexus-graphql](https://nexusjs.org/) library for generating GraphQL schema using TypeScript objects
- [nexus-decorators](https://github.com/graphql-nexus/nexus-decorators) experimental decorator syntax for use with `nexus-graphql`
- [graphql-code-generator](https://www.graphql-code-generator.com/) generate TypeScript types from `gql` queries (for front-end consuming the API)

[This tutorial](https://github.com/lmiller1990/vue-3-urql-example) demonstrates how to build a type-safe GraphQL app using the above technologies. It's a good place to start, to learn how and why each tool is used.

## Development

You will generally develop this in parallel with a front-end, in this case `@packages/launchpad`. Run `yarn dev` in `@packages/launchpad` and it will start up the GraphQL server. This also re-generates the `graphql.schema` file based on the declarations inside of [entities](https://github.com/cypress-io/cypress/blob/develop/packages/graphql/src/entities). 

Visit `http://localhost:52159/graphql` for the GraphiQL interface.

![graphql](./gql.png)

You can also develop in a test-driven manner using the tests.

- `yarn test-unit` for the unit tests
- `yarn test-integration` for the integration tests

## Project Structure

- [BaseActions](https://github.com/cypress-io/cypress/blob/develop/packages/graphql/src/actions/BaseActions.ts) defines what actions must be implemented by a client. In this case, we have [ServerActions](https://github.com/cypress-io/cypress/blob/develop/packages/server/lib/graphql/ServerActions.ts) which is what we use for production in the actual app, and [ClientTestActions](https://github.com/cypress-io/cypress/blob/develop/packages/launchpad/src/graphql/ClientTestContext.ts) which is used to mock the actions when testing components using Cypress E2E or CT. The same concept applies to [BaseContext](https://github.com/cypress-io/cypress/blob/develop/packages/graphql/src/BaseContext.ts)

- [Entities](https://github.com/cypress-io/cypress/blob/develop/packages/graphql/src/entities) defines how various parts of Cypress are exposed via GraphQL. They are defined using [nexus-decorators](https://github.com/graphql-nexus/nexus-decorators) for type safety.
