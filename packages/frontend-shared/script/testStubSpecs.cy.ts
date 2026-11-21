import { template } from 'lodash'
import { TEMPLATE_INTERPOLATE } from './testStubSpecs'

const LAZY_INTERPOLATE = /{{([\s\S]+?)}}/g

const data = { prefix: 'Cy', modifier: 'Async', domain: 'Billing', component: 'Table', component2: 'Row' }

describe('TEMPLATE_INTERPOLATE', () => {
  const cases: Array<[label: string, source: string]> = [
    ['a directory template', 'packages/{{component}}/test'],
    ['adjacent placeholders', 'lib/{{component}}{{component2}}/__test__'],
    ['a name template', '{{prefix}}{{modifier}}{{domain}}{{component}}'],
    ['a template with no placeholders', 'frontend/components'],
    ['an expression with spaces', '{{ component.toLowerCase() }}.cy.ts'],
    ['an expression across lines', '{{\ncomponent\n}}'],
    ['a brace inside an expression', '{{ ({ a: component }).a }}'],
    ['an unclosed opener', 'src/{{component'],
    ['an empty string', ''],
  ]

  cases.forEach(([label, source]) => {
    it(`renders ${label} like the lazy {{ }} pattern`, () => {
      const expected = template(source, { interpolate: LAZY_INTERPOLATE })(data)

      expect(template(source, { interpolate: TEMPLATE_INTERPOLATE })(data)).to.equal(expected)
    })
  })

  it('leaves the body out of a stray opener before a real placeholder', () => {
    expect(template('{{ {{component}}', { interpolate: TEMPLATE_INTERPOLATE })(data)).to.equal('{{ Table')
  })

  it('scans 50,000 characters of unclosed openers in linear time', () => {
    const source = `${'}{{{'.repeat(12_500)}}`
    const start = performance.now()

    expect(source.replace(TEMPLATE_INTERPOLATE, '')).to.equal(source)
    expect(performance.now() - start).to.be.lessThan(200)
  })
})
