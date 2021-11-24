module.exports = {
  baseUrl: 'https://cypress.com',
  e2e: {
    async setupNodeEvents (on, config) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      throw new Error('Error Loading Plugin!!!')
    },
  },
}
