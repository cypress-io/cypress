import { spawnSync } from 'child_process'
import { describe, it, expect } from 'vitest'
import $utils from '../../../src/cypress/utils'

describe('driver/src/cypress/utils', () => {
  describe('.decodeBase64Unicode', () => {
    // https://github.com/cypress-io/cypress/issues/35201
    it('decodes a large payload within a capped heap', () => {
      // Runs in a child process so that exhausting the capped heap fails this
      // test with a non-zero exit instead of taking down the test runner. The
      // child receives the decoder as source text, so the decoder must not
      // reference anything outside its own body.
      const script = `
        const decode = ({ ${$utils.decodeBase64Unicode.toString()} }).decodeBase64Unicode
        const json = JSON.stringify({ mappings: 'AAAA;'.repeat(16e6 / 5) })

        process.stdout.write(String(decode(Buffer.from(json).toString('base64')) === json))
      `

      const result = spawnSync(process.execPath, ['--max-old-space-size=256', '-e', script], { encoding: 'utf8' })

      expect(result.signal).toBeNull()
      expect(result.status).toBe(0)
      expect(result.stdout).toBe('true')
    })

    it('decodes characters outside the Basic Multilingual Plane', () => {
      expect($utils.decodeBase64Unicode('eyJzdGF0ZSI6IvCfmYIifQ==')).toBe('{"state":"🙂"}')
    })

    it('throws on input that is not valid UTF-8', () => {
      expect(() => $utils.decodeBase64Unicode('/w==')).toThrow()
    })

    it('keeps a leading byte order mark', () => {
      expect($utils.decodeBase64Unicode('77u/e30=')).toBe('﻿{}')
    })
  })
})
