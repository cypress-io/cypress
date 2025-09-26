import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/detectors/circleCiDetectorSync.spec.ts',
      'test/detectors/githubActionsDetectorSync.spec.ts',
      'test/processors/on-start-span-processor.spec.ts',
      'test/span-exporters/cloud-span-exporter.spec.ts',
      'test/span-exporters/console-trace-link-exporter.spec.ts',
      'test/span-exporters/ipc-span-exporter.spec.ts',
      'test/span-exporters/websocket-span-exporter.spec.ts',
      'test/browser.spec.ts',
    ],
    globals: true,
    environment: 'node',
  },
})
