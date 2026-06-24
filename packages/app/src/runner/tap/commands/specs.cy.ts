import type { FoundSpec } from '@packages/types'

import { TapManager } from '../tap-manager'

const CYPRESS_VERSION = '15.0.0'

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

  it('lists the server-embedded specs, keeping only the lean entry fields', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('specs')).to.deep.eq({
      ok: true,
      result: [
        { relative: 'cypress/e2e/login.cy.ts', specType: 'integration' },
        { relative: 'src/Button.cy.tsx', specType: 'component' },
      ],
    })
  })

  it('resolves an empty list when the specs global is not present', async () => {
    const manager = new TapManager(CYPRESS_VERSION)

    expect(await manager.exec('specs')).to.deep.eq({ ok: true, result: [] })
  })
})
