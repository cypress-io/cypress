module.exports = {
  projectId: 'abc123',
  experimentalInteractiveRunEvents: true,
  component: {
    specPattern: 'src/**/*.{spec,cy}.{js,ts,tsx,jsx}',
    supportFile: 'cypress/component/support/index.ts',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/vite-dev-server')

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
    devServerConfig: {
      viteConfig: {
        // TODO(tim): Figure out why this isn't being picked up
        optimizeDeps: {
          include: [
            '@headlessui/vue',
            'vue3-file-selector',
            'just-my-luck',
            'combine-properties',
            'faker',
            '@packages/ui-components/cypress/support/customPercyCommand',
          ],
        },
      },
    },
  },
  e2e: {
    specPattern: 'cypress/e2e/**/*.spec.{js,ts}',
    supportFile: false,
  },
}
