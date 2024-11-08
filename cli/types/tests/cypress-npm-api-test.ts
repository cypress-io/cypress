// type tests for Cypress NPM module
// https://on.cypress.io/module-api
import cypress, { defineComponentFramework, defineConfig } from 'cypress'

cypress.run // $ExpectType (options?: Partial<CypressRunOptions> | undefined) => Promise<CypressRunResult | CypressFailedRunResult>
cypress.open // $ExpectType (options?: Partial<CypressOpenOptions> | undefined) => Promise<void>
cypress.run({
  tag: 'production,nightly'
})
cypress.run({}).then(results => {
  results // $ExpectType CypressRunResult | CypressFailedRunResult
})
cypress.run().then(results => {
  results // $ExpectType CypressRunResult | CypressFailedRunResult
  if ('runs' in results) { // results is CypressRunResult
    results.runUrl // $ExpectType string | undefined
  } else {
    results.failures // $ExpectType number
    results.message // $ExpectType string
  }
})
cypress.open() // $ExpectType Promise<void>
cypress.run() // $ExpectType Promise<CypressRunResult | CypressFailedRunResult>

cypress.run({
  configFile: "abc123"
})

// provide only some config options
const runConfig: Cypress.ConfigOptions = {
  e2e: {
    baseUrl: 'http://localhost:8080',
  },
  env: {
    login: false
  },
}
cypress.run({ config: runConfig })

cypress.run({}).then((results) => {
  results as CypressCommandLine.CypressRunResult // $ExpectType CypressRunResult
})

// the caller can determine if Cypress ran or failed to launch
cypress.run().then(results => {
  results // $ExpectType CypressRunResult | CypressFailedRunResult
})

const config = defineConfig({
  modifyObstructiveCode: true
})

const solid = {
  type: 'solid-js',
  name: 'Solid.js',
  package: 'solid-js',
  installer: 'solid-js',
  description: 'Solid is a declarative JavaScript library for creating user interfaces',
  minVersion: '^1.0.0'
}

const thirdPartyFrameworkDefinition = defineComponentFramework({
  type: 'cypress-ct-third-party',
  name: 'Third Party',
  dependencies: (bundler) => [solid],
  detectors: [solid],
  supportedBundlers: ['vite', 'webpack'],
  icon: '<svg>...</svg>'
})

const thirdPartyFrameworkDefinitionInvalidStrings = defineComponentFramework({
  type: 'cypress-ct-third-party',
  name: 'Third Party',
  dependencies: (bundler) => [],
  detectors: [{}], // $ExpectError
  supportedBundlers: ['metro', 'webpack'] // $ExpectError
})

// component options
const componentConfigNextWebpack: Cypress.ConfigOptions = {
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'next',
    }
  }
}

const componentConfigReactWebpack: Cypress.ConfigOptions = {
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'react',
    }
  }
}

const componentConfigVueWebpack: Cypress.ConfigOptions = {
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'vue',
    }
  }
}

const componentConfigViteReact: Cypress.ConfigOptions = {
  component: {
    devServer: {
      bundler: 'vite',
      framework: 'react',
    }
  }
}

const componentConfigViteVue: Cypress.ConfigOptions = {
  component: {
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    }
  }
}
