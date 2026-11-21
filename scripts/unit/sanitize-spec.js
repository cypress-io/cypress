const { expect } = require('chai')
const fs = require('fs')
const path = require('path')

const { sanitizeCliInfo } = require('../sanitize')

// `cypress info --dev` piped through `term-to-html` with FORCE_COLOR=2, as the
// cli-visual-tests CI job does, on a machine where Chrome for Testing is the
// only browser found.
const cypressInfoHtml = fs.readFileSync(path.join(__dirname, '__fixtures__/cypress-info.html'), 'utf8')

const GREEN = '<span style="color:#0A0">'
const YELLOW = '<span style="color:#A50">'
const RESET = '<span style="color:#111">'

describe('scripts/sanitize cli-info', () => {
  it('masks the browser version, browser name and memory in cypress info output', () => {
    const sanitized = sanitizeCliInfo(cypressInfoHtml)

    expect(sanitized).to.contain(`  - Version: ${GREEN}***chromium version***${RESET}\n`)
    expect(sanitized).not.to.contain('153.0.8010.12')
    expect(sanitized).to.contain(`System Memory: ${GREEN}***total memory***${RESET} free ${GREEN}***free memory***${RESET}`)
    expect(sanitized).not.to.contain('16.9 GB')
  })

  it('masks only the word characters of a hyphenated browser name', () => {
    expect(sanitizeCliInfo(cypressInfoHtml)).to.contain(`${YELLOW}- cypress run --browser ***name:channel***-for-testing${RESET}`)
  })

  it('leaves the rest of the output untouched', () => {
    const lines = (html) => html.split('\n').filter((line) => !/- Version: |--browser |System Memory: /.test(line))

    expect(lines(sanitizeCliInfo(cypressInfoHtml))).to.deep.equal(lines(cypressInfoHtml))
  })

  // Inputs below follow the shape of the output above with versions and
  // browsers this container doesn't have, rather than captured output.
  ;[
    ['a Chrome version', `- Version: ${GREEN}131.0.6778.85${RESET}`, `- Version: ${GREEN}***chromium version***${RESET}`],
    ['a Firefox version', `- Version: ${GREEN}133.0${RESET}`, `- Version: ${GREEN}***firefox version***${RESET}`],
    ['a Firefox Developer Edition version, which neither version pattern covers', `- Version: ${GREEN}134.0b9${RESET}`, `- Version: ${GREEN}134.0b9${RESET}`],
    ['a browser name with a channel', '--browser firefox:dev', '--browser ***name:channel***'],
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
