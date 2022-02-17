import { defineConfig } from 'cypress'

// @ts-check

// let's bundle spec files and the components they include using
// the same bundling settings as the project by loading .babelrc
// https://github.com/bahmutov/cypress-react-unit-test#install
const { devServer } = require('@cypress/react/plugins/babel')

export default defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 500,
  viewportHeight: 500,
  component: {
    devServer,
    componentFolder: 'src',
    testFiles: '**/*spec.tsx',
  },
})
