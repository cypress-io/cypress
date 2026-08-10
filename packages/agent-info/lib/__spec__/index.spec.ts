import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { detectAgent, isAgent } from '..'

describe('lib/agent-info', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('reports no agent for an environment that names none', () => {
    expect(detectAgent({})).toBeUndefined()
    expect(isAgent({})).toBe(false)
  })

  it.each([
    ['claude', { CLAUDECODE: '1' }],
    ['claude', { CLAUDE_CODE: '1' }],
    ['replit', { REPL_ID: 'abc' }],
    ['gemini', { GEMINI_CLI: '1' }],
    ['codex', { CODEX_SANDBOX: 'seatbelt' }],
    ['codex', { CODEX_THREAD_ID: 'abc' }],
    ['opencode', { OPENCODE: '1' }],
    ['pi', { PATH: '/usr/bin:/Users/someone/.pi/agent/bin' }],
    ['auggie', { AUGMENT_AGENT: '1' }],
    ['goose', { GOOSE_PROVIDER: 'anthropic' }],
    ['junie', { JUNIE_DATA: '/data' }],
    ['junie', { JUNIE_SHIM_PATH: '/shim' }],
    ['devin', { EDITOR: '/usr/local/bin/devin' }],
    ['cursor', { CURSOR_AGENT: '1' }],
    ['kiro', { TERM_PROGRAM: 'kiro' }],
  ])('detects %s', (name, env) => {
    expect(detectAgent(env)).toBe(name)
    expect(isAgent(env)).toBe(true)
  })

  it('matches the pi agent on a Windows-style PATH', () => {
    expect(detectAgent({ PATH: 'C:\\Users\\someone\\.pi\\agent\\bin' })).toBe('pi')
  })

  it('ignores an env var that is set but empty', () => {
    expect(detectAgent({ CLAUDECODE: '' })).toBeUndefined()
  })

  it('reports the agent rather than the IDE hosting it', () => {
    expect(detectAgent({ CURSOR_AGENT: '1', CLAUDECODE: '1' })).toBe('claude')
  })

  describe('TTY-gated matches', () => {
    // vitest runs without a TTY, so isTTY is absent rather than false and cannot be spied on.
    const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY')

    beforeEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true })
    })

    afterEach(() => {
      if (originalIsTTY) {
        Object.defineProperty(process.stdout, 'isTTY', originalIsTTY)
      } else {
        delete (process.stdout as any).isTTY
      }
    })

    it('does not report kiro when a human is at an interactive terminal', () => {
      expect(detectAgent({ TERM_PROGRAM: 'kiro' })).toBeUndefined()
    })

    it('still reports an explicitly named agent from an interactive terminal', () => {
      expect(detectAgent({ TERM_PROGRAM: 'kiro', CLAUDECODE: '1' })).toBe('claude')
    })
  })

  describe('AI_AGENT', () => {
    it('narrows a version-bearing value to its known name', () => {
      expect(detectAgent({ AI_AGENT: 'claude-code_2-1-221_agent' })).toBe('claude')
    })

    it('is case insensitive', () => {
      expect(detectAgent({ AI_AGENT: 'Cursor' })).toBe('cursor')
    })

    it('reports an unrecognized value as other, never verbatim', () => {
      expect(detectAgent({ AI_AGENT: 'some-internal-tool-v3' })).toBe('other')
    })

    it('loses to an env var the detection table recognizes', () => {
      expect(detectAgent({ AI_AGENT: 'cursor', CLAUDECODE: '1' })).toBe('claude')
    })
  })

  it('reads process.env when no environment is passed', () => {
    vi.stubEnv('CLAUDECODE', '1')

    expect(detectAgent()).toBe('claude')
    expect(isAgent()).toBe(true)
  })
})
