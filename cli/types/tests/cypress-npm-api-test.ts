// type tests for Cypress NPM module
// https://on.cypress.io/module-api
import cypress, { defineConfig } from 'cypress'

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
  if (results.status === 'failed') {
    results // $ExpectType CypressFailedRunResult
  } else {
    results // $ExpectType CypressRunResult
    results.status // $ExpectType "finished"
  }
})

const config = defineConfig({
  modifyObstructiveCode: true
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
