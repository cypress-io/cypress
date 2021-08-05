exports['Wizard sampleCode returns sampleCode when framework and bundler is set 1'] = {
  "wizard": {
    "sampleCode": "// Component testing, TypeScript, Create React App, Webpack\nimport { startDevServer } from '@cypress/webpack-dev-server'\nimport webpackConfig from './webpack.config'\n\nexport default {\n  component(on, config) {\n    on('dev-server:start', (options) => {\n      return startDevServer({ options, webpackConfig })\n    })\n  }\n}"
  }
}
