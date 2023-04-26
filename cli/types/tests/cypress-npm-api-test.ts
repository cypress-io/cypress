// type Mocha.Mocha.Tests for Cypress NPM module
// https://on.cypress.io/module-api
import cypress, { defineComponentFramework, defineConfig } from 'cypress'
import { expectType } from '.'

expectType<(options?: Partial<CypressCommandLine.CypressRunOptions> | undefined) => Promise<CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult>>(cypress.run)
expectType<(options?: Partial<CypressCommandLine.CypressOpenOptions> | undefined) => Promise<void>>(cypress.open)
cypress.run({
  tag: 'production,nightly'
})
cypress.run({}).then(results => {
expectType<CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult>(  results)
})
cypress.run().then(results => {
expectType<CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult>(  results)
  if ('runs' in results) { // results is CypressRunResult
expectType<string | undefined>(    results.runUrl)
  } else {
expectType<number>(    results.failures)
expectType<string>(    results.message)
  }
})
expectType<Promise<void>>(cypress.open())
expectType<Promise<CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult>>(cypress.run())

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
expectType<CypressCommandLine.CypressRunResult>(  results as CypressCommandLine.CypressRunResult)
})

// the caller can determine if Cypress ran or failed to launch
cypress.run().then(results => {
  if (results.status === 'failed') {
expectType<CypressCommandLine.CypressFailedRunResult>(    results)
  } else {
expectType<CypressCommandLine.CypressRunResult>(    results)
expectType<"finished">(    results.status)
  }
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
  // @ts-expect-error
  detectors: [{}],
  // @ts-expect-error
  supportedBundlers: ['metro', 'webpack']
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

const componentConfigVueCliWebpack: Cypress.ConfigOptions = {
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'vue-cli',
      webpackConfig: {}
    }
  }
}

const componentConfigNuxtWebpack: Cypress.ConfigOptions = {
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'nuxt',
      webpackConfig: {}
    }
  }
}

const componentConfigCRAWebpack: Cypress.ConfigOptions = {
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'create-react-app',
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
