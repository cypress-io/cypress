module.exports = {
  // ...
  // Configuration options accepted by the `relay-compiler` command-line tool and `babel-plugin-relay`.
  src: './src',
  schema: '../server/lib/graphql/server-schema.graphql',
  exclude: ['**/node_modules/**', '**/__mocks__/**', '**/__generated__/**'],
  language: 'typescript-hooks-gen-preview',
  artifactDirectory: './src/__generated__',
  extensions: ['tsx', 'jsx'],
  noFutureProofEnums: true,
}
