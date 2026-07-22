import type { FoundSpec } from '@packages/types'
import type { Client } from '@urql/core'

import { TapManager } from '../tap-manager'

const CYPRESS_VERSION = '15.0.0'

interface StubSpec {
  relative: string
  specType: 'integration' | 'component'
  gitInfo?: { lastModifiedHumanReadable: string | null } | null
}

const stubGqlClient = (specs: StubSpec[]): Client => {
  return {
    query: () => ({ toPromise: async () => ({ data: { currentProject: { specs } } }) }),
  } as unknown as Client
}

describe('tap/commands/specs', () => {
  const RUN_MODE_SPECS: FoundSpec[] = [
    {
      name: 'login.cy.ts',
      relative: 'cypress/e2e/login.cy.ts',
      absolute: '/project/cypress/e2e/login.cy.ts',
      baseName: 'login.cy.ts',
      fileName: 'login',
      fileExtension: '.ts',
      specFileExtension: '.cy.ts',
      specType: 'integration',
    },
    {
      name: 'Button.cy.tsx',
      relative: 'src/Button.cy.tsx',
      absolute: '/project/src/Button.cy.tsx',
      baseName: 'Button.cy.tsx',
      fileName: 'Button',
      fileExtension: '.tsx',
      specFileExtension: '.cy.tsx',
      specType: 'component',
    },
  ]

  afterEach(() => {
    delete (window as any).__RUN_MODE_SPECS__
  })

  it('lists specs from the live GraphQL client, with git last-modified, when a client is set (open mode)', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const gqlClient = stubGqlClient([
      { relative: 'cypress/e2e/added-while-open.cy.ts', specType: 'integration', gitInfo: { lastModifiedHumanReadable: '2 hours ago' } },
      { relative: 'cypress/e2e/no-git.cy.ts', specType: 'integration', gitInfo: null },
    ])
    const manager = new TapManager(CYPRESS_VERSION)

    manager.setGqlClient(gqlClient)

    expect(await manager.exec('specs')).to.deep.eq({
      result: [
        { relativePath: 'cypress/e2e/added-while-open.cy.ts', specType: 'integration', lastModified: '2 hours ago' },
        { relativePath: 'cypress/e2e/no-git.cy.ts', specType: 'integration' },
      ],
    })
  })

  it('falls back to the server-embedded snapshot when there is no GraphQL client', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('specs')).to.deep.eq({
      result: [
        { relativePath: 'cypress/e2e/login.cy.ts', specType: 'integration' },
        { relativePath: 'src/Button.cy.tsx', specType: 'component' },
      ],
    })
  })

  it('resolves an empty list when neither a client nor the specs global is present', async () => {
    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('specs')).to.deep.eq({ result: [] })
  })
})
