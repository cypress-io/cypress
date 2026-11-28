import { vi, describe, it, expect } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import dedent from 'dedent'
import { addProjectIdToCypressConfig, addTestingTypeToCypressConfig } from '../../src/ast-utils/addToCypressConfig'

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual<{ default: typeof import('fs-extra') }>()

  return {
    default: {
      ...actual.default,
      writeFile: vi.fn(),
    },
  }
})

const getWrittenConfig = (): string => {
  expect(fs.writeFile).toHaveBeenCalledOnce()

  const [call] = vi.mocked(fs.writeFile).mock.calls

  if (!call) throw new Error('fs.writeFile was not called')

  return call[1].trim()
}

describe('addToCypressConfig', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('will create a ts file if the file is empty and the file path is ts', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.ts'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
      projectRoot: __dirname,
    })

    expect(getWrittenConfig()).toEqual(dedent`
      import { defineConfig } from "cypress";

      export default defineConfig({
        e2e: {
          setupNodeEvents(on, config) {
            // implement node event listeners here
          },
        },
      });
    `)

    expect(result.result).toEqual('ADDED')
  })

  it('will create a module file if the file is empty and the project is ECMA Script', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.js'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: true,
      projectRoot: __dirname,
    })

    expect(getWrittenConfig()).toEqual(dedent`
          import { defineConfig } from "cypress";

          export default defineConfig({
            e2e: {
              setupNodeEvents(on, config) {
                // implement node event listeners here
              },
            },
          });
        `)

    expect(result.result).toEqual('ADDED')
  })

  it('will create a js file if the file is empty and the file path is js', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.js'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
      projectRoot: __dirname,
    })

    expect(getWrittenConfig()).toEqual(dedent`
          const { defineConfig } = require("cypress");

          module.exports = defineConfig({
            e2e: {
              setupNodeEvents(on, config) {
                // implement node event listeners here
              },
            },
          });
        `)

    expect(result.result).toEqual('ADDED')
  })

  it('will add a component definition to an empty ts file', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.ts'),
      info: {
        testingType: 'component',
        framework: 'react',
        bundler: 'vite',
      },
      isProjectUsingESModules: false,
      projectRoot: __dirname,
    })

    expect(getWrittenConfig()).toEqual(dedent`
      import { defineConfig } from "cypress";

      export default defineConfig({
        component: {
          devServer: {
            framework: "react",
            bundler: "vite",
          },
        },
      });
    `)

    expect(result.result).toEqual('ADDED')
  })

  it('will merge a component definition into a config that uses TypeScript-only syntax', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/typed-e2e.config.ts'),
      info: {
        testingType: 'component',
        framework: 'react',
        bundler: 'vite',
      },
      isProjectUsingESModules: false,
      projectRoot: __dirname,
    })

    expect(getWrittenConfig()).toEqual(dedent`
      import { defineConfig } from "cypress";
      import type { PluginEvents, PluginConfigOptions } from "cypress";

      const baseUrl: string = "http://localhost:3000";
      const viewport = { viewportWidth: 1280, viewportHeight: 720 } as const;

      export default defineConfig({
        e2e: {
          baseUrl,
          ...viewport,
          setupNodeEvents(on: PluginEvents, config: PluginConfigOptions) {
            return config;
          },
        },

        component: {
          devServer: {
            framework: "react",
            bundler: "vite",
          },
        },
      });
    `)

    expect(result.result).toEqual('MERGED')
  })

  it('will keep comments in the existing config when merging', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/commented.config.ts'),
      info: {
        testingType: 'component',
        framework: 'react',
        bundler: 'vite',
      },
      isProjectUsingESModules: false,
      projectRoot: __dirname,
    })

    expect(getWrittenConfig()).toEqual(dedent`
      import { defineConfig } from "cypress";

      export default defineConfig({
        // Matches the port the storefront dev server listens on
        e2e: {
          baseUrl: "http://localhost:3000",
        },

        component: {
          devServer: {
            framework: "react",
            bundler: "vite",
          },
        },
      });
    `)

    expect(result.result).toEqual('MERGED')
  })

  const esmConfig = dedent`
    import { defineConfig } from "cypress";

    export default defineConfig({
      e2e: {
        setupNodeEvents(on, config) {
          // implement node event listeners here
        },
      },
    });
  `

  const cjsConfig = dedent`
    const { defineConfig } = require("cypress");

    module.exports = defineConfig({
      e2e: {
        setupNodeEvents(on, config) {
          // implement node event listeners here
        },
      },
    });
  `

  it.each([
    ['mts', 'an ESM', false, esmConfig],
    ['mjs', 'an ESM', false, esmConfig],
    ['cts', 'a CommonJS', true, cjsConfig],
    ['cjs', 'a CommonJS', true, cjsConfig],
  ])('will create a .%s file as %s config if the file is empty, whether or not the project is ECMA Script', async (extension, _kind, isProjectUsingESModules, expected) => {
    const { result: status } = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, `../__fixtures__/empty.config.${extension}`),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules,
      projectRoot: __dirname,
    })

    expect(getWrittenConfig()).toEqual(expected)

    expect(status).toEqual('ADDED')
  })

  it('will exclude defineConfig if cypress can\'t be imported from the projectRoot', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.js'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
      projectRoot: '/foo',
    })

    expect(getWrittenConfig()).toEqual(dedent`
      module.exports = {
        e2e: {
          setupNodeEvents(on, config) {
            // implement node event listeners here
          },
        },
      };
    `)

    expect(result.result).toEqual('ADDED')
  })

  it('will exclude defineConfig if cypress can\'t be imported from the projectRoot for an ECMA Script project', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.js'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: true,
      projectRoot: '/foo',
    })

    expect(getWrittenConfig()).toEqual(dedent`
      export default {
        e2e: {
          setupNodeEvents(on, config) {
            // implement node event listeners here
          },
        },
      };
    `)

    expect(result.result).toEqual('ADDED')
  })

  it('will error if we are unable to add to the config', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/invalid.config.ts'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
      projectRoot: __dirname,
    })

    expect(result.result).toEqual('NEEDS_MERGE')
    expect(result.error?.message).toEqual('Unable to automerge with the config file')
  })

  it('will error if the key we are adding already exists', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/has-e2e.config.ts'),
      info: {
        testingType: 'e2e',
      },
      isProjectUsingESModules: false,
      projectRoot: __dirname,
    })

    expect(result.result).toEqual('NEEDS_MERGE')
    expect(result.error?.message).toEqual('Unable to automerge with the config file')
  })
})

describe('addProjectIdToCypressConfig', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('will add the projectId as a string to an existing config', async () => {
    const result = await addProjectIdToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/has-e2e.config.ts'),
      projectId: 'ypt4pf',
    })

    expect(getWrittenConfig()).toEqual(dedent`
      export default {
        e2e: {},
        projectId: "ypt4pf",
      };
    `)

    expect(result.result).toEqual('MERGED')
  })
})
