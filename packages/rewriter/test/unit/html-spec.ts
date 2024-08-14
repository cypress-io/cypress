import { expect } from 'chai'
import { rewriteHtmlJs } from '../../lib/html'
import snapshot from 'snap-shot-it'
import { testHtml } from '../fixtures'

const URL = 'http://example.com/foo.html'

const rewriteNoSourceMap = (html) => rewriteHtmlJs(URL, html)

describe('html rewriter', function () {
  context('.rewriteHtmlJs', function () {
    // https://github.com/cypress-io/cypress/issues/2393
    it('strips SRI', async function () {
      snapshot(await rewriteNoSourceMap('<script type="text/javascript" integrity="foo" src="bar">'))

      snapshot(await rewriteNoSourceMap('<script type="text/javascript" integrity="foo" src="bar"/>'))

      snapshot(await rewriteNoSourceMap('<script type="text/javascript" integrity="foo" src="bar">foo</script>'))

      // should preserve namespaced attrs and still rewrite if no `type`
      snapshot(await rewriteNoSourceMap('<script foo:bar="baz" integrity="foo" src="bar">'))
    })

    it('rewrites a real-ish document with sourcemaps for inline js', async () => {
      const actual: any = {}

      actual.html = await rewriteHtmlJs(URL, testHtml, (sourceInfo) => {
        actual.sourceInfo = sourceInfo

        return 'foo'
      })

      snapshot(actual)
    })

    context('with inline scripts', function () {
      it('rewrites inline JS with no type', async function () {
        snapshot(await rewriteNoSourceMap('<script>window.top</script>'))
      })

      it('rewrites inline JS with type', async function () {
        snapshot(await rewriteNoSourceMap('<script type="text/javascript">window.top</script>'))
      })

      it('does not rewrite non-JS inline', async function () {
        snapshot(await rewriteNoSourceMap('<script type="x-foo/bar">window.top</script>'))
      })

      it('ignores invalid inline JS', async function () {
        const str = '<script>(((((((((((</script>'

        expect(await rewriteHtmlJs(URL, str)).to.eq(str)
      })

      it('rewrites extra long JS string', async function () {
        snapshot(await rewriteNoSourceMap(`<script type="text/javascript">window.top; const a =\'${'a'.repeat(16223)}\'; window.top;</script>'`))
      })
    })
  })
})
