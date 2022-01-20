module.exports = {
  'e2e': {
    baseUrl: 'https://cypress.com',
    supportFile: false,
    async setupNodeEvents (on, config) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      throw new Error('Error Loading Plugin!!!')
    },
  },
}
