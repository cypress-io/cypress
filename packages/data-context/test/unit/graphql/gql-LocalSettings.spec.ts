import { beforeEach, describe, expect, it } from '@jest/globals'
import { execute, parse } from 'graphql'
import type { DataContext } from '../../../src'
import { graphqlSchema } from '../../../graphql/schema'
import { createTestDataContext } from '../helper'

describe('LocalSettingsPreferences', () => {
  let ctx: DataContext

  const queryPreferredEditorBinary = async () => {
    const result = await execute({
      schema: graphqlSchema,
      document: parse('{ localSettings { preferences { preferredEditorBinary } } }'),
      contextValue: ctx,
    })

    expect(result.errors).toBeUndefined()

    return (result.data as any).localSettings.preferences.preferredEditorBinary
  }

  beforeEach(() => {
    ctx = createTestDataContext('open')
    ctx.coreData.localSettings.availableEditors = [
      { id: 'computer', name: 'Finder', binary: 'computer' },
      { id: 'code', name: 'Visual Studio Code', binary: 'code' },
    ]
  })

  describe('preferredEditorBinary', () => {
    it('returns a detected editor', async () => {
      ctx.coreData.localSettings.preferences.preferredEditorBinary = 'code'

      expect(await queryPreferredEditorBinary()).toEqual('code')
    })

    it('reads a saved editor Cypress did not detect as unset', async () => {
      ctx.coreData.localSettings.preferences.preferredEditorBinary = '/usr/local/bin/my-editor'

      expect(await queryPreferredEditorBinary()).toBeNull()
    })

    it('returns null when no editor is saved', async () => {
      expect(await queryPreferredEditorBinary()).toBeNull()
    })
  })
})
