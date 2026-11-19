import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import { execute, parse } from 'graphql'
import { GET_MAJOR_VERSION_FOR_CONTENT } from '@packages/types'
import { graphqlSchema } from '../../../graphql/schema'
import { createTestDataContext } from '../helper'

const query = parse('{ localSettings { preferences { majorVersionWelcomeDismissed shouldLaunchBrowserFromOpenBrowser } } }')

describe('LocalSettingsPreferences.majorVersionWelcomeDismissed', () => {
  const originalEnv = process.env

  const dismissedBy = async (modeOptions: Parameters<typeof createTestDataContext>[1], saved: Record<string, number>) => {
    // isWelcomeBypassedForAgent treats cliBrowser as no evidence of a browser given on the
    // command line, since a config reload copies the active browser into it too. Only
    // isBrowserGivenByCli (or a defaultBrowser) counts.
    const ctx = createTestDataContext('open', { isBrowserGivenByCli: true, ...modeOptions })

    jest.spyOn(ctx._apis.localSettingsApi, 'getPreferences').mockResolvedValue({ majorVersionWelcomeDismissed: saved })
    jest.spyOn(ctx._apis.browserApi, 'ensureAndGetByNameOrPath').mockResolvedValue({ name: 'electron' } as any)
    ctx.coreData.cliBrowser = 'electron'

    const result = await execute({ schema: graphqlSchema, document: query, contextValue: ctx })

    return (result.data as any).localSettings.preferences
  }

  beforeEach(() => {
    process.env = { PATH: originalEnv.PATH }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('reports what was saved for a person', async () => {
    expect((await dismissedBy({ project: 'foo', testingType: 'e2e' }, {})).majorVersionWelcomeDismissed).toEqual({})
  })

  it('reports the welcome as dismissed when the server skipped it for an agent', async () => {
    process.env.CLAUDECODE = '1'

    const { majorVersionWelcomeDismissed } = await dismissedBy({ project: 'foo', testingType: 'e2e' }, {})

    expect(majorVersionWelcomeDismissed[GET_MAJOR_VERSION_FOR_CONTENT()]).toEqual(expect.any(Number))
  })

  it('keeps a dismissal that was saved', async () => {
    process.env.CLAUDECODE = '1'

    const { majorVersionWelcomeDismissed } = await dismissedBy({ project: 'foo', testingType: 'e2e' }, { [GET_MAJOR_VERSION_FOR_CONTENT()]: 42 })

    expect(majorVersionWelcomeDismissed[GET_MAJOR_VERSION_FOR_CONTENT()]).toBe(42)
  })

  it('does not report it as dismissed for an agent that did not name the testing type', async () => {
    process.env.CLAUDECODE = '1'

    expect((await dismissedBy({ project: 'foo' }, {})).majorVersionWelcomeDismissed).toEqual({})
  })

  it('leaves launching the browser to the server for an agent, so it is not launched twice', async () => {
    process.env.CLAUDECODE = '1'

    expect((await dismissedBy({ project: 'foo', testingType: 'e2e' }, {})).shouldLaunchBrowserFromOpenBrowser).toBe(false)
  })

  it('still has the Launchpad launch the browser for a person who gave --browser alone', async () => {
    expect((await dismissedBy({ project: 'foo' }, {})).shouldLaunchBrowserFromOpenBrowser).toBe(true)
  })
})
