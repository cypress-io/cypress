import proxyquire from 'proxyquire'
import fsExtra from 'fs-extra'
import sinon from 'sinon'
import path from 'path'
import { expect } from 'chai'
import dedent from 'dedent'

const stub = sinon.stub()

beforeEach(() => {
  stub.reset()
})

const { addTestingTypeToCypressConfig } = proxyquire('../../src/ast-utils/addToCypressConfig', {
  'fs-extra': {
    ...fsExtra,
    writeFile: stub,
  },
}) as typeof import('../../src/ast-utils/addToCypressConfig')

describe('addToCypressConfig', () => {
  it('will create a ts file if the file is empty and the file path is ts', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.ts'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
    })

    expect(stub.firstCall.args[1].trim()).to.eq(dedent`
      import { defineConfig } from "cypress";

      export default defineConfig({
        e2e: {
          setupNodeEvents(on, config) {
            // implement node event listeners here
          },
        },
      });
    `)

    expect(result.result).to.eq('ADDED')
  })

  it('will create a module file if the file is empty and the project is ECMA Script', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.js'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: true,
    })

    expect(stub.firstCall.args[1].trim()).to.eq(dedent`
      import { defineConfig } from "cypress";

      export default defineConfig({
        e2e: {
          setupNodeEvents(on, config) {
            // implement node event listeners here
          },
        },
      });
    `)

    expect(result.result).to.eq('ADDED')
  })

  it('will create a js file if the file is empty and the file path is js', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.js'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
    })

    expect(stub.firstCall.args[1].trim()).to.eq(dedent`
      const { defineConfig } = require("cypress");

      module.exports = defineConfig({
        e2e: {
          setupNodeEvents(on, config) {
            // implement node event listeners here
          },
        },
      });
    `)

    expect(result.result).to.eq('ADDED')
  })

  it('will error if we are unable to add to the config', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/invalid.config.ts'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
    })

    expect(result.result).to.eq('NEEDS_MERGE')
    expect(result.error.message).to.eq('Unable to automerge with the config file')
  })

  it('will error if the key we are adding already exists', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/has-e2e.config.ts'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
    })

    expect(result.result).to.eq('NEEDS_MERGE')
    expect(result.error.message).to.eq('Unable to automerge with the config file')
  })

  it('adds component testing to e2e config', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/has-e2e.config.ts'),
      info: {
        testingType: 'component',
        bundler: 'webpack',
        framework: 'react',
      },
      isProjectUsingESModules: false,
    })

    expect(stub.getCall(0).lastArg.trim()).to.eq(dedent`
    export default {
      e2e: {},
    
      component: {
        devServer: {
          framework: "react",
          bundler: "webpack",
          // provide your webpack config here...
          // webpackConfig,
        },
      },
    };`.trim())

    expect(result.result).to.eq('MERGED')
  })

  it('adds component testing and webpack config to e2e config', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/has-e2e.config.ts'),
      info: {
        testingType: 'component',
        bundler: 'webpack',
        framework: 'react',
        webpackConfigPath: './webpack.config.ts',
      },
      isProjectUsingESModules: true,
    })

    expect(stub.getCall(0).lastArg.trim()).to.eq(dedent`
    import webpackConfig from "./webpack.config.ts";
    export default {
      e2e: {},
    
      component: {
        devServer: {
          framework: "react",
          bundler: "webpack",
          webpackConfig,
        },
      },
    };`.trim())

    expect(result.result).to.eq('MERGED')
  })

  it('adds component testing and webpack config to e2e config', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/has-e2e.config.js'),
      info: {
        testingType: 'component',
        bundler: 'webpack',
        framework: 'react',
        webpackConfigPath: './webpack.config.js',
      },
      isProjectUsingESModules: false,
    })

    expect(stub.getCall(0).lastArg.trim()).to.eq(dedent`
    const webpackConfig = require("./webpack.config.js");
    module.exports = {
      e2e: {},
    
      component: {
        devServer: {
          framework: "react",
          bundler: "webpack",
          webpackConfig,
        },
      },
    };`.trim())

    expect(result.result).to.eq('MERGED')
  })
})
