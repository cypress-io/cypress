import { describe, it, expect } from 'vitest'
import { isKeptVar, sanitizeEnv } from '../src/env-allowlist'

describe('sanitizeEnv', () => {
  it('removes variables outside the allowlist', () => {
    const env = {
      PATH: '/usr/local/bin:/usr/bin',
      TMPDIR: '/var/folders/k2/x7d1/T/',
      SUDO_UID: '3434',
      HOME: '/home/jane-doe',
      CYPRESS_RECORD_KEY: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      GITHUB_TOKEN: 'ghp_k3Jd9sLq0wXz7VbNm2RtYp5HcFgA8eUi4oZs',
      DEBUG: 'cypress:*',
      npm_config_loglevel: 'warn',
    }

    sanitizeEnv(env)

    expect(env).toEqual({
      PATH: '/usr/local/bin:/usr/bin',
      TMPDIR: '/var/folders/k2/x7d1/T/',
      SUDO_UID: '3434',
    })
  })

  it('keeps Windows system variables regardless of case', () => {
    expect(isKeptVar('Path')).toBe(true)
    expect(isKeptVar('SystemRoot')).toBe(true)
    expect(isKeptVar('ComSpec')).toBe(true)
    expect(isKeptVar('AppData')).toBe(true)
  })
})
