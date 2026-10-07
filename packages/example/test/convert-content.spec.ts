/* eslint-disable quotes */

import { describe, expect, it } from 'vitest'
import { convertExampleContent } from '../bin/convert-content'

describe('convertExampleContent', () => {
  it('retargets the dev server origin at the deployed site', () => {
    expect(convertExampleContent(`cy.visit('http://localhost:8080/commands/actions')`))
    .toEqual(`cy.visit('https://example.cypress.io/commands/actions')`)
  })

  it('rewrites location assertions to the deployed host', () => {
    expect(convertExampleContent(`expect(loc.host).to.eq('localhost:8080')`))
    .toEqual(`expect(loc.host).to.eq('example.cypress.io')`)

    expect(convertExampleContent(`expect(loc.hostname).to.eq('localhost')`))
    .toEqual(`expect(loc.hostname).to.eq('example.cypress.io')`)
  })

  it('empties the port assertion, since the deployed site serves on the default port', () => {
    expect(convertExampleContent(`expect(loc.port).to.eq('8080')`))
    .toEqual(`expect(loc.port).to.eq('')`)
  })

  it('rewrites the protocol assertion to https', () => {
    expect(convertExampleContent(`expect(loc.protocol).to.eq('http:')`))
    .toEqual(`expect(loc.protocol).to.eq('https:')`)
  })

  it('absolutizes asset paths passed to imgSrcToDataURL', () => {
    expect(convertExampleContent(`cy.imgSrcToDataURL('/assets/logo.png')`))
    .toEqual(`cy.imgSrcToDataURL('https://example.cypress.io/assets/logo.png')`)
  })

  it('strips eslint directives, which are meaningless in a scaffolded project', () => {
    expect(convertExampleContent(`// eslint-disable-next-line no-unused-vars\nconst a = 1`))
    .toEqual(`const a = 1`)

    expect(convertExampleContent(`/* eslint-disable */\nconst b = 2`))
    .toEqual(`const b = 2`)
  })

  it('rewrites the origin before the host assertion when a line contains both', () => {
    expect(convertExampleContent(`cy.visit('http://localhost:8080/x'); expect(loc.host).to.eq('localhost:8080')`))
    .toEqual(`cy.visit('https://example.cypress.io/x'); expect(loc.host).to.eq('example.cypress.io')`)
  })

  it('leaves unrelated content alone', () => {
    const untouched = [
      `const eslintConfig = 1 // nothing to strip here`,
      `cy.visit('https://example.cypress.io/commands/actions')`,
      `expect(port).to.eq('9000')`,
    ].join('\n')

    expect(convertExampleContent(untouched)).toEqual(untouched)
  })

  it('is idempotent, so a re-run cannot double-rewrite', () => {
    const source = [
      `cy.visit('http://localhost:8080/commands/location')`,
      `expect(loc.host).to.eq('localhost:8080')`,
      `expect(loc.hostname).to.eq('localhost')`,
      `expect(loc.port).to.eq('8080')`,
      `expect(loc.protocol).to.eq('http:')`,
      `cy.imgSrcToDataURL('/assets/logo.png')`,
    ].join('\n')

    const once = convertExampleContent(source)

    expect(convertExampleContent(once)).toEqual(once)
  })
})
