import { describe, expect, it } from 'vitest'
import { htmlHelper } from '../../../../lib/http/util/rewriter'

const injected = `<script>(() => { TEST })()</script>`

describe('http/util/rewriter', () => {
  describe('.tests', () => {
    it('HTML text with no injection', () => {
      expect(htmlHelper('HTML', undefined)).toEqual('HTML')
    })

    it('HTML text', () => {
      expect(htmlHelper('HTML', injected)).toEqual(`${injected} HTML`)
    })

    it('just a DOCTYPE tag', () => {
      expect(htmlHelper('<!DOCTYPE html>', injected)).toEqual(`<!DOCTYPE html> ${injected}`)
    })

    it('DOCTYPE tag with HTML text', () => {
      expect(htmlHelper('<!DOCTYPE html>HTML', injected)).toEqual(`<!DOCTYPE html> ${injected}HTML`)
    })

    it('commented DOCTYPE tag and HTML text', () => {
      expect(htmlHelper('<!-- <!DOCTYPE html> -->HTML', injected)).toEqual(`${injected} <!-- <!DOCTYPE html> --> HTML`)
    })
  })
})
