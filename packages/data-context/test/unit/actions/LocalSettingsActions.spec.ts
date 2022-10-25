import type { DataContext } from '../../../src'
import { LocalSettingsActions } from '../../../src/actions/LocalSettingsActions'
import { createTestDataContext } from '../helper'
import { expect } from 'chai'
import sinon from 'sinon'

describe('LocalSettingsActions', () => {
  let ctx: DataContext
  let actions: LocalSettingsActions

  const SIMPLE_STRING_KV = { testProjectPref: 'testValue' }
  const SIMPLE_NUMBER_KV = { number: 123 }
  const NESTED_STATE = { nested: {
    firstItem: 'hello',
    secondItem: 'word',
  } }
  const UPDATED_NESTED_STATE = { nested: {
    thirdItem: 'new',
  } }

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    actions = new LocalSettingsActions(ctx)

    ctx._apis.localSettingsApi.setPreferences = sinon.stub()
    ctx._apis.projectApi.setProjectPreferences = sinon.stub()
  })

  context('saving project preferences', () => {
    it('should save a single key-value pair to project preferences', async () => {
      actions.setPreferences(JSON.stringify(SIMPLE_STRING_KV), 'project')

      // confirm correct value was set in state
      expect(ctx.coreData.localSettings.preferences).to.deep.eq(SIMPLE_STRING_KV)

      // confirm the value was set at the "project" level, and not the general "local settings" of Cypress
      expect(ctx._apis.projectApi.setProjectPreferences).to.be.calledWith(SIMPLE_STRING_KV)
      expect(ctx._apis.localSettingsApi.setPreferences).not.to.be.called
    })

    it('should save multiple key-value pairs', async () => {
      ctx._apis.projectApi.setProjectPreferences = sinon.stub()

      actions.setPreferences(JSON.stringify(SIMPLE_STRING_KV), 'project')
      actions.setPreferences(JSON.stringify(SIMPLE_NUMBER_KV), 'project')

      expect(ctx.coreData.localSettings.preferences).to.deep.eq({ ...SIMPLE_NUMBER_KV, ...SIMPLE_STRING_KV })
    })

    it('should merge nested objects', async () => {
      ctx._apis.projectApi.setProjectPreferences = sinon.stub()

      actions.setPreferences(JSON.stringify(NESTED_STATE), 'project')
      actions.setPreferences(JSON.stringify(UPDATED_NESTED_STATE), 'project')

      expect(ctx.coreData.localSettings.preferences).to.deep.eq({ nested: { ...NESTED_STATE.nested, ...UPDATED_NESTED_STATE.nested } })
    })
  })

  context('saving "global" preferences', () => {
    it('should save a single key-value pair', async () => {
      actions.setPreferences(JSON.stringify(SIMPLE_STRING_KV), 'global')

      // confirm correct value was set in state
      expect(ctx.coreData.localSettings.preferences).to.deep.eq(SIMPLE_STRING_KV)

      // confirm the value was set at the general "local settings" of Cypress, not the "project" level
      expect(ctx._apis.localSettingsApi.setPreferences).to.be.calledWith(SIMPLE_STRING_KV)
      expect(ctx._apis.projectApi.setProjectPreferences).not.to.be.called
    })

    it('should save multiple key-value pairs', async () => {
      actions.setPreferences(JSON.stringify(SIMPLE_STRING_KV), 'global')
      actions.setPreferences(JSON.stringify(SIMPLE_NUMBER_KV), 'global')

      expect(ctx.coreData.localSettings.preferences).to.deep.eq({ ...SIMPLE_NUMBER_KV, ...SIMPLE_STRING_KV })
    })

    it('should merge nested objects', async () => {
      actions.setPreferences(JSON.stringify(NESTED_STATE), 'project')
      actions.setPreferences(JSON.stringify(UPDATED_NESTED_STATE), 'project')

      expect(ctx.coreData.localSettings.preferences).to.deep.eq({ nested: { ...NESTED_STATE.nested, ...UPDATED_NESTED_STATE.nested } })
    })
  })
})
