import { expect } from 'chai'
import { rewriteHtmlJs } from '../../lib/html'
import snapshot from 'snap-shot-it'

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

const URL = 'http://example.com/foo.html'

describe('lib/html', function () {
  context('.rewriteHtmlJs', function () {
    // https://github.com/cypress-io/cypress/issues/2393
    it('strips SRI', function () {
      snapshot(rewriteHtmlJs(URL, '<script type="text/javascript" integrity="foo" src="bar">'))

      snapshot(rewriteHtmlJs(URL, '<script type="text/javascript" integrity="foo" src="bar"/>'))

      snapshot(rewriteHtmlJs(URL, '<script type="text/javascript" integrity="foo" src="bar">foo</script>'))

      // should preserve namespaced attrs and still rewrite if no `type`
      snapshot(rewriteHtmlJs(URL, '<script foo:bar="baz" integrity="foo" src="bar">'))
    })

    it('rewrites a real-ish document', () => {
      snapshot(rewriteHtmlJs(URL, original))
    })

    context('with inline scripts', function () {
      it('rewrites inline JS with no type', function () {
        snapshot(rewriteHtmlJs(URL, '<script>window.top</script>'))
      })

      it('rewrites inline JS with type', function () {
        snapshot(rewriteHtmlJs(URL, '<script type="text/javascript">window.top</script>'))
      })

      it('does not rewrite non-JS inline', function () {
        snapshot(rewriteHtmlJs(URL, '<script type="x-foo/bar">window.top</script>'))
      })

      it('ignores invalid inline JS', function () {
        const str = '<script>(((((((((((</script>'

        expect(rewriteHtmlJs(URL, str)).to.eq(str)
      })
    })
  })
})
