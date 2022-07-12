import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // @ts-ignore
    foo: ,
    supportFile: false,
    setupNodeEvents: async (_, config) => {
      return config
    },
  },
})
