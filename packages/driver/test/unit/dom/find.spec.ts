import $ from 'jquery'
import { beforeEach, describe, expect, it } from 'vitest'

import { getContainsSelector } from '../../../src/dom/elements/find'

describe('dom/elements/find', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('cy-contains-regex pseudo', () => {
    // https://github.com/cypress-io/cypress/issues/34303
    it('matches every candidate element when the regex has the global flag', () => {
      document.body.innerHTML = `
        <ul>
          <li>asdf 1</li>
          <li>asdf 2</li>
          <li>asdf 3</li>
        </ul>
      `

      const selector = getContainsSelector(/asdf \d/g, 'li')
      const $matches = $(selector, document.body)

      expect($matches).toHaveLength(3)
    })

    it('matches every candidate element when the regex has the sticky flag', () => {
      document.body.innerHTML = `
        <ul>
          <li>asdf 1</li>
          <li>asdf 2</li>
          <li>asdf 3</li>
        </ul>
      `

      const selector = getContainsSelector(/^asdf \d/y, 'li')
      const $matches = $(selector, document.body)

      expect($matches).toHaveLength(3)
    })
  })
})
