// For use with Apollo Extension for VSCode:
// https://www.apollographql.com/docs/devtools/editor-plugins/
module.exports = {
  client: {
    service: {
      name: 'cypress-io',
      localSchemaFile: './packages/graphql/schemas/schema.graphql',
    },
    tagName: 'gql',
    includes: ['./packages/launchpad/src/**/*.vue'],
  },
}
