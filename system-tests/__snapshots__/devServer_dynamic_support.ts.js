exports['devServer dynamic import throws error when devServer use dynamic import instead of require 1'] = `
The \`component\`.\`devServer\` method must be a function with the following signature:

\`\`\`
devServer: (cypressDevServerConfig, devServerConfig) {
  // start dev server here
}
\`\`\`

Learn more: https://on.cypress.io/dev-server

We loaded the \`devServer\` from: \`/foo/bar/.projects/devServer-dynamic-import/cypress.config.js\`

It exported:

 {"supportFile":false,"devServer":{},"devServerConfig":{"webpackFilename":"webpack.config.js"}}

`
