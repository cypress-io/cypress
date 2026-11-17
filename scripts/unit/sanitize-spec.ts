import { expect } from 'chai'
import { spawnSync } from 'child_process'
import path from 'path'

const sanitizeScript = path.join(__dirname, '..', 'sanitize.js')

const sanitizeCliInfo = (input: string) => {
  const { stdout, stderr, status } = spawnSync(process.execPath, [sanitizeScript, '--type', 'cli-info'], { input, encoding: 'utf8' })

  expect(status, stderr).to.eq(0)

  return stdout
}

describe('sanitize --type cli-info', () => {
  context('chromium versions', () => {
    it('replaces a four-part chromium version and keeps the surrounding tags', () => {
      const output = sanitizeCliInfo('- Version: <span style="color:#A50">130.0.6723.58</span>\n')

      expect(output).to.eq('- Version: <span style="color:#A50">***chromium version***</span>\n')
    })

    it('replaces every chromium version in the output', () => {
      const output = sanitizeCliInfo([
        'Browser: Chrome',
        '- Version: <span>130.0.6723.58</span>',
        'Browser: Electron',
        '- Version: <span>98.0.4758.141</span>',
        '',
      ].join('\n'))

      expect(output).to.eq([
        'Browser: Chrome',
        '- Version: <span>***chromium version***</span>',
        'Browser: Electron',
        '- Version: <span>***chromium version***</span>',
        '',
      ].join('\n'))
    })

    it('leaves a three-part firefox version to the firefox sanitizer', () => {
      const output = sanitizeCliInfo('- Version: <span>131.0.3</span>\n')

      expect(output).to.eq('- Version: <span>***firefox version***</span>\n')
    })
  })
})
