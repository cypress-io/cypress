import { expect } from 'chai'
import { rewriteHtmlJs } from '../../lib/html'

describe('lib/html', function () {
  context('.rewriteHtmlJs', function () {
    it('strips SRI', function () {
      expect(rewriteHtmlJs('<script type="text/javascript" integrity="foo" src="bar">'))
      .to.eq('<script type="text/javascript" cypress:stripped-integrity="foo" src="bar">')

      expect(rewriteHtmlJs('<script type="text/javascript" integrity="foo" src="bar"/>'))
      .to.eq('<script type="text/javascript" cypress:stripped-integrity="foo" src="bar"/>')

      expect(rewriteHtmlJs('<script type="text/javascript" integrity="foo" src="bar">foo</script>'))
      .to.eq('<script type="text/javascript" cypress:stripped-integrity="foo" src="bar">foo</script>')

      // should preserve namespaced attrs and still rewrite if no `type`
      expect(rewriteHtmlJs('<script foo:bar="baz" integrity="foo" src="bar">'))
      .to.eq('<script foo:bar="baz" cypress:stripped-integrity="foo" src="bar">')
    })

    context('with inline scripts', function () {
      it('rewrites inline JS', function () {
        expect(rewriteHtmlJs('<script>window.top</script>'))
        .to.eq('<script>globalThis.top.Cypress.resolveWindowReference(globalThis, window, \'top\')</script>')

        expect(rewriteHtmlJs('<script type="text/javascript">window.top</script>'))
        .to.eq('<script type="text/javascript">globalThis.top.Cypress.resolveWindowReference(globalThis, window, \'top\')</script>')
      })

      it('does not rewrite non-JS inline', function () {
        expect(rewriteHtmlJs('<script type="x-foo/bar">window.top</script>'))
        .to.eq('<script type="x-foo/bar">window.top</script>')
      })

      it('ignores invalid inline JS', function () {
        expect(rewriteHtmlJs('<script>(((((((((((</script>'))
        .to.eq('<script>(((((((((((</script>')
      })
    })
  })
})
