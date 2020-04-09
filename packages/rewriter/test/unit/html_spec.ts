import { expect } from 'chai'
import { rewriteHtmlJs } from '../../lib/html'

const original = `\
<html>
  <body>
    top1
    settop
    settopbox
    parent1
    grandparent
    grandparents
    topFoo
    topFoo.window
    topFoo.window != topFoo
    parentFoo
    parentFoo.window
    parentFoo.window != parentFoo

    <div style="left: 1500px; top: 0px;"></div>
    <div style="left: 1500px; top : 0px;"></div>
    <div style="left: 1500px; top  : 0px;"></div>

    parent()
    foo.parent()
    top()
    foo.top()
    foo("parent")
    foo("top")

    const parent = () => { bar: 'bar' }

    parent.bar

    <script type="text/javascript">
      if (top != self) run()
      if (top!=self) run()
      if (self !== top) run()
      if (self!==top) run()
      if (self === top) return
      if (top.location!=self.location&&(top.location.href=self.location.href)) run()
      if (top.location != self.location) run()
      if (top.location != location) run()
      if (self.location != top.location) run()
      if (parent.frames.length > 0) run()
      if (window != top) run()
      if (window.top !== window.self) run()
      if (window.top!==window.self) run()
      if (window.self != window.top) run()
      if (window.top != window.self) run()
      if (window["top"] != window["parent"]) run()
      if (window['top'] != window['parent']) run()
      if (window["top"] != self['parent']) run()
      if (parent && parent != window) run()
      if (parent && parent != self) run()
      if (parent && window != parent) run()
      if (parent && self != parent) run()
      if (parent && parent.frames && parent.frames.length > 0) run()
      if ((self.parent && !(self.parent === self)) && (self.parent.frames.length != 0)) run()
      if (parent !== null && parent.tag !== 'HostComponent' && parent.tag !== 'HostRoot') { }
      if (null !== parent && parent.tag !== 'HostComponent' && parent.tag !== 'HostRoot') { }
      if (top===self) return
      if (top==self) return
    </script>
  </body>
</html>\
`

const expected = `\
<html>
  <body>
    top1
    settop
    settopbox
    parent1
    grandparent
    grandparents
    topFoo
    topFoo.window
    topFoo.window != topFoo
    parentFoo
    parentFoo.window
    parentFoo.window != parentFoo

    <div style="left: 1500px; top: 0px;"></div>
    <div style="left: 1500px; top : 0px;"></div>
    <div style="left: 1500px; top  : 0px;"></div>

    parent()
    foo.parent()
    top()
    foo.top()
    foo("parent")
    foo("top")

    const parent = () => { bar: 'bar' }

    parent.bar

    <script type="text/javascript">
      if ((top === globalThis['top'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'top') : top) != self) run()
      if ((top === globalThis['top'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'top') : top)!=self) run()
      if (self !== (top === globalThis['top'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'top') : top)) run()
      if (self!==(top === globalThis['top'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'top') : top)) run()
      if (self === (top === globalThis['top'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'top') : top)) return
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, top, 'location')!=globalThis.top.Cypress.resolveWindowReference(globalThis, self, 'location')&&(globalThis.top.Cypress.resolveWindowReference(globalThis, top, 'location').href=globalThis.top.Cypress.resolveWindowReference(globalThis, self, 'location').href)) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, top, 'location') != globalThis.top.Cypress.resolveWindowReference(globalThis, self, 'location')) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, top, 'location') != location) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, self, 'location') != globalThis.top.Cypress.resolveWindowReference(globalThis, top, 'location')) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, parent, 'frames').length > 0) run()
      if (window != (top === globalThis['top'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'top') : top)) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top') !== window.self) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top')!==window.self) run()
      if (window.self != globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top')) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top') != window.self) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top') != globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'parent')) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top') != globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'parent')) run()
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top') != globalThis.top.Cypress.resolveWindowReference(globalThis, self, 'parent')) run()
      if ((parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) && (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) != window) run()
      if ((parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) && (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) != self) run()
      if ((parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) && window != (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent)) run()
      if ((parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) && self != (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent)) run()
      if ((parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) && globalThis.top.Cypress.resolveWindowReference(globalThis, parent, 'frames') && globalThis.top.Cypress.resolveWindowReference(globalThis, parent, 'frames').length > 0) run()
      if ((globalThis.top.Cypress.resolveWindowReference(globalThis, self, 'parent') && !(globalThis.top.Cypress.resolveWindowReference(globalThis, self, 'parent') === self)) && (globalThis.top.Cypress.resolveWindowReference(globalThis, self.parent, 'frames').length != 0)) run()
      if ((parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) !== null && (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent).tag !== 'HostComponent' && (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent).tag !== 'HostRoot') { }
      if (null !== (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent) && (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent).tag !== 'HostComponent' && (parent === globalThis['parent'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'parent') : parent).tag !== 'HostRoot') { }
      if ((top === globalThis['top'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'top') : top)===self) return
      if ((top === globalThis['top'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'top') : top)==self) return
    </script>
  </body>
</html>\
`

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

    it('rewrites a real-ish document', () => {
      expect(rewriteHtmlJs(original)).to.eq(expected)
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
