import snapshot from 'snap-shot-it'
import { createConfigString } from '../../src/util/migration'

describe('migration utils', () => {
  it('should create a string when passed only a global option', async () => {
    const config = {
      visualViewport: 300,
    }

    const generatedConfig = await createConfigString(config)

    snapshot(generatedConfig)
  })

  it('should create a string when passed only a e2e options', async () => {
    const config = {
      e2e: {
        baseUrl: 'localhost:3000',
      },
    }

    const generatedConfig = await createConfigString(config)

    snapshot(generatedConfig)
  })

  it('should create a string when passed only a component options', async () => {
    const config = {
      component: {
        retries: 2,
      },
    }

    const generatedConfig = await createConfigString(config)

    snapshot(generatedConfig)
  })

  it('should create a string for a config with global, component, and e2e options', async () => {
    const config = {
      visualViewport: 300,
      baseUrl: 'localhost:300',
      e2e: {
        retries: 2,
      },
      component: {
        retries: 1,
      },
    }

    const generatedConfig = await createConfigString(config)

    snapshot(generatedConfig)
  })

  it('should create a string when passed an empty object', async () => {
    const config = {}

    const generatedConfig = await createConfigString(config)

    snapshot(generatedConfig)
  })

  it('should exclude fields that are no longer valid', async () => {
    const config = {
      '$schema': 'http://someschema.com',
      pluginsFile: 'path/to/plugin/file',
      componentFolder: 'path/to/component/folder',
    }

    const generatedConfig = await createConfigString(config)

    snapshot(generatedConfig)
  })
})
