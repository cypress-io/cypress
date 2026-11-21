const { expect } = require('chai')
const fs = require('fs')
const path = require('path')

const { sanitizeCliInfo } = require('../sanitize')

// `cypress info` piped through `term-to-html` with FORCE_COLOR=2, as the
// cli-visual-tests CI job does.
const cypressInfoHtml = fs.readFileSync(path.join(__dirname, '__fixtures__/cypress-info.html'), 'utf8')

const GREEN = '<span style="color:#0A0">'
const RESET = '<span style="color:#111">'

describe('scripts/sanitize cli-info', () => {
  it('masks browser versions, browser names and memory in cypress info output', () => {
    const sanitized = sanitizeCliInfo(cypressInfoHtml)

    expect(sanitized).to.contain(`  - Version: ${GREEN}***chromium version***${RESET}\n`)
    expect(sanitized).to.contain(`  - Version: ${GREEN}***firefox version***${RESET}\n`)
    expect(sanitized).not.to.contain('131.0.6778.85')
    expect(sanitized).not.to.contain('130.0.6723.137')
    expect(sanitized).not.to.contain('133.0<')
    expect(sanitized).to.contain('--browser ***name:channel***')
    expect(sanitized).to.contain(`System Memory: ${GREEN}***total memory***${RESET} free ${GREEN}***free memory***${RESET}`)
  })

  it('leaves a Firefox Developer Edition version, which neither version pattern covers', () => {
    expect(sanitizeCliInfo(cypressInfoHtml)).to.contain(`- Version: ${GREEN}134.0b9${RESET}`)
  })

  ;[
    ['a Chrome version', `- Version: ${GREEN}131.0.6778.85${RESET}`, `- Version: ${GREEN}***chromium version***${RESET}`],
    ['a Firefox version', `- Version: ${GREEN}133.0${RESET}`, `- Version: ${GREEN}***firefox version***${RESET}`],
    ['a Firefox ESR version', `- Version: ${GREEN}128.5.1${RESET}`, `- Version: ${GREEN}***firefox version***${RESET}`],
    ['nested opening tags', `- Version: <b>${GREEN}131.0.6778.85${RESET}`, `- Version: <b>${GREEN}***chromium version***${RESET}`],
    ['text after the closing tag', `- Version: ${GREEN}133.0${RESET} (beta)`, `- Version: ${GREEN}***firefox version***${RESET} (beta)`],
    ['a version without tags', '- Version: 131.0.6778.85', '- Version: 131.0.6778.85'],
    ['a tag broken across lines', `- Version: <span\n>133.0${RESET}`, `- Version: <span\n>133.0${RESET}`],
    ['memory with nested tags', `System Memory: <b>${GREEN}16.8 GB${RESET} free ${GREEN}9.21 GB${RESET}`, `System Memory: <b>${GREEN}***total memory***${RESET} free ${GREEN}***free memory***${RESET}`],
    ['an empty string', '', ''],
  ].forEach(([label, input, expected]) => {
    it(`sanitizes ${label}`, () => {
      expect(sanitizeCliInfo(input)).to.equal(expected)
    })
  })

  ;[
    ['unclosed tags after Version', '- Version: <s'.repeat(3_846)],
    ['unclosed tags with a colon after Version', '- Version: <:'.repeat(3_846)],
    ['repeated memory lines', `${'System Memory: <f>e'.repeat(2_632)}\x00`],
  ].forEach(([label, input]) => {
    it(`leaves 50,000 characters of ${label} without a match in linear time`, () => {
      const start = performance.now()

      expect(sanitizeCliInfo(input)).to.equal(input)
      expect(performance.now() - start).to.be.lessThan(200)
    })
  })
})
