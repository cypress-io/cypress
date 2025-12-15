import { describe, expect, it } from 'vitest'
import { htmlHelper } from '../../../../lib/http/util/rewriter'

const injected = `<script type="text/javascript">INJECTED_CYPRESS_CODE()</script>`

describe('http/util/rewriter', () => {
  describe('.tests', () => {
    it('HTML text with no injection', () => {
      expect(htmlHelper('HTML', undefined)).toEqual('HTML')
    })

    it('toplevel script tag and html tag', () => {
      expect(htmlHelper(`
        <script>
          console.log(Cypress)
        </script>
        <html>
          Hello World
        </html>`, injected))
      .toEqual(`${injected} 
        <script>
          console.log(Cypress)
        </script>
        <html>
          Hello World
        </html>`)
    })

    it('only a head tag', () => {
      expect(htmlHelper(`
        <head>
          <title>Example</title>
        </head>`, injected))
      .toEqual(`
        <head> ${injected}
          <title>Example</title>
        </head>`)
    })

    it('only a body tag', () => {
      expect(htmlHelper(`
        <body>
          Hello World
        </body>`, injected))
      .toEqual(`
        <head> ${injected} </head> <body>
          Hello World
        </body>`)
    })

    it('only a HTML tag', () => {
      expect(htmlHelper(`
        <html>
          Hello World
        </html>`, injected))
      .toEqual(`
        <html> <head> ${injected} </head>
          Hello World
        </html>`)
    })

    it('only DOCTYPE content', () => {
      expect(htmlHelper(`
        <!DOCTYPE html>`, injected))
      .toEqual(`
        <!DOCTYPE html><head> ${injected} </head>`)
    })

    it('only a DIV tag', () => {
      expect(htmlHelper(`
        <div>Test</div>`, injected))
      .toEqual(`<head> ${injected} </head>
        <div>Test</div>`)
    })
  })
})
