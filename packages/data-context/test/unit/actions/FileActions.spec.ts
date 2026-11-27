import { beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'path'
import launchEditor from 'launch-editor'
import type { DataContext } from '../../../src'
import { FileActions } from '../../../src/actions/FileActions'
import { createTestDataContext } from '../helper'

vi.mock('launch-editor')

describe('FileActions', () => {
  let ctx: DataContext
  let actions: FileActions

  beforeEach(() => {
    ctx = createTestDataContext('open')
    ctx.coreData.currentProject = path.resolve('/project')
    ctx.coreData.localSettings.availableEditors = [
      { id: 'computer', name: 'Finder', binary: 'computer' },
      { id: 'code', name: 'Visual Studio Code', binary: 'code' },
    ]

    ctx._apis.electronApi.showItemInFolder = vi.fn()
    vi.mocked(launchEditor).mockClear()

    actions = new FileActions(ctx)
  })

  describe('openFile', () => {
    it('launches a detected editor at the line and column', async () => {
      ctx.coreData.localSettings.preferences.preferredEditorBinary = 'code'

      await actions.openFile('cypress/e2e/spec.cy.ts', 3, 5)

      expect(launchEditor).toHaveBeenCalledWith(`${path.resolve('/project/cypress/e2e/spec.cy.ts')}:3:5`, `'code'`, expect.any(Function))
    })

    it('shows the file in the file manager for "computer"', async () => {
      ctx.coreData.localSettings.preferences.preferredEditorBinary = 'computer'

      await actions.openFile('cypress/e2e/spec.cy.ts')

      expect(ctx._apis.electronApi.showItemInFolder).toHaveBeenCalledWith(path.resolve('/project/cypress/e2e/spec.cy.ts'))
      expect(launchEditor).not.toHaveBeenCalled()
    })

    it('does not launch an editor Cypress did not detect', async () => {
      ctx.coreData.localSettings.preferences.preferredEditorBinary = '/bin/sh'

      await actions.openFile('cypress/e2e/spec.cy.ts')

      expect(launchEditor).not.toHaveBeenCalled()
      expect(ctx._apis.electronApi.showItemInFolder).not.toHaveBeenCalled()
    })
  })
})
