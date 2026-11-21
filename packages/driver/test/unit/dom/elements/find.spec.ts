import $ from 'jquery'
import { beforeEach, describe, expect, it } from 'vitest'

import { getContainsSelector } from '../../../../src/dom/elements/find'

const matchedIds = (text: RegExp, options: { matchCase?: boolean } = {}) => {
  return $(getContainsSelector(text, 'div', { matchCase: true, ...options }), document.body)
  .toArray()
  .map((el) => el.id)
}

describe('dom/elements/find', () => {
  describe('cy-contains-regex pseudo', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="greetings">
          <div id="d1">Hello Jane Doe</div>
          <div id="d2">Hello John Smith</div>
          <div id="d3">Hello Maria Garcia</div>
          <div id="d4">Hello Wei Chen</div>
        </div>
      `
    })

    const allGreetings = ['greetings', 'd1', 'd2', 'd3', 'd4']

    it('matches every element that contains the pattern', () => {
      expect(matchedIds(/Hello/)).toEqual(allGreetings)
    })

    // https://github.com/cypress-io/cypress/issues/34303
    it.each([/Hello/g, /Hello/gi, /Hello/gm])('matches every element that contains the pattern with %s', (regex) => {
      expect(matchedIds(regex)).toEqual(allGreetings)
    })

    it('matches every element whose text starts with the pattern with the sticky flag', () => {
      expect(matchedIds(/Hello/y)).toEqual(['d1', 'd2', 'd3', 'd4'])
    })

    it('matches the same elements when the same global regex is queried again', () => {
      const regex = /Hello (Jane|John)/g

      expect(matchedIds(regex)).toEqual(['greetings', 'd1', 'd2'])
      expect(matchedIds(regex)).toEqual(['greetings', 'd1', 'd2'])
      expect(matchedIds(new RegExp(regex.source, regex.flags))).toEqual(['greetings', 'd1', 'd2'])
    })

    it('matches a single element with a global regex every time it is queried', () => {
      document.body.innerHTML = '<div id="greeting">Hello Wei Chen</div>'

      const selector = getContainsSelector(/Hello Wei/g, '#greeting')

      expect($(selector, document.body)).toHaveLength(1)
      expect($(selector, document.body)).toHaveLength(1)
    })

    it('does not change the lastIndex of the regex passed in', () => {
      const regex = /Hello/g

      regex.lastIndex = 3
      matchedIds(regex)

      expect(regex.lastIndex).toBe(3)
    })

    it('matches case-insensitively with the i flag or matchCase: false', () => {
      expect(matchedIds(/hello wei/)).toEqual([])
      expect(matchedIds(/hello wei/i)).toEqual(['greetings', 'd4'])
      expect(matchedIds(/hello wei/, { matchCase: false })).toEqual(['greetings', 'd4'])
      expect(matchedIds(/hello wei/g, { matchCase: false })).toEqual(['greetings', 'd4'])
    })

    it('matches every submit input whose value contains the pattern with the global flag', () => {
      document.body.innerHTML = `
        <input id="save" type="submit" value="Save changes">
        <input id="save-draft" type="submit" value="Save draft">
      `

      expect($(getContainsSelector(/Save/g, 'input'), document.body).toArray().map((el) => el.id)).toEqual(['save', 'save-draft'])
    })
  })
})
