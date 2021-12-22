module.exports = {
  projectId: 'abc123',
  // @ts-expect-error
  clientRoute: '/cy-child/',
  namespace: 'cy-child',
  testFiles: '**/*.{spec,cy}.{js,ts,tsx,jsx}',
  integrationFolder: 'cypress/e2e/integration',
  componentFolder: 'src',
  supportFile: false,
  experimentalInteractiveRunEvents: true,
  component: {
    testFiles: '**/*.{spec,cy}.{js,ts,tsx,jsx}',
    supportFile: 'cypress/component/support/index-real.ts',
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
    testFiles: '**/*.{spec,cy}.{js,ts,tsx,jsx}',
  },
}
