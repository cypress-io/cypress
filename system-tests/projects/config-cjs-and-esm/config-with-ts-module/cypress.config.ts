import { defineConfig } from 'cypress'

const fn = async (_, config) => {
  const ret = await import('find-up')

  console.log(ret)

  return config
}

export default defineConfig({
  e2e: {
    supportFile: false,
    setupNodeEvents: fn,
  },
})
