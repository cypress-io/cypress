const path = require('path')

// For use with Apollo Extension for VSCode:
// https://www.apollographql.com/docs/devtools/editor-plugins/
module.exports = {
  client: {
    service: {
      name: 'cypress-io',
      localSchemaFile: path.join(__dirname, 'packages/graphql/schemas/schema.graphql'),
    },
    tagName: 'gql',
    includes: [path.join(__dirname, 'packages/{launchpad,app,frontend-shared}/src/**/*.{vue,ts,js,tsx,jsx}')],
  },
}
