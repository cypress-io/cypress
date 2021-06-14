// Switch to directory of this config file to search for relay.config.js
process.chdir(__dirname)

const { config } = require('vscode-apollo-relay').generateConfig()

config.client.includes = [
  '/tmp/relay-compiler-directives-v11.0.2.graphql',
  'src/**/*.{graphql,jsx,ts,tsx}',
]

// console.log(config)

module.exports = config
