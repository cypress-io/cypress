module.exports = {
  numTestsKeptInMemory: 0,
  video: false,
  e2e: {
    specPattern: 'no-matches/**.cy.*',
  },
  component: {
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
}
