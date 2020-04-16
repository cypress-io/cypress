exports['lib/html .rewriteHtmlJs strips SRI 1'] = `
<script type="text/javascript" cypress:stripped-integrity="foo" src="bar">
`

exports['lib/html .rewriteHtmlJs strips SRI 2'] = `
<script type="text/javascript" cypress:stripped-integrity="foo" src="bar"/>
`

exports['lib/html .rewriteHtmlJs strips SRI 3'] = `
<script type="text/javascript" cypress:stripped-integrity="foo" src="bar">foo
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvby5odG1sOjAgKG9yaWdpbmFsKSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLENBQUMiLCJmaWxlIjoiZm9vLmh0bWw6MCAob3JpZ2luYWwpLm1hcCIsInNvdXJjZVJvb3QiOiJodHRwOi8vZXhhbXBsZS5jb20vIiwic291cmNlc0NvbnRlbnQiOlsiZm9vIl19</script>
`

exports['lib/html .rewriteHtmlJs strips SRI 4'] = `
<script foo:bar="baz" cypress:stripped-integrity="foo" src="bar">
`

exports['lib/html .rewriteHtmlJs rewrites a real-ish document 1'] = `
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
      if (globalThis.top.Cypress.resolveWindowReference(globalThis, top, 'location') != (location === globalThis['location'] ? globalThis.top.Cypress.resolveWindowReference(globalThis, globalThis, 'location') : location)) run()
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
    
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvby5odG1sOjAgKG9yaWdpbmFsKSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO01BQ00sQ0FBQyxFQUFFLGtIQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNyQixDQUFDLEVBQUUsaUhBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ25CLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGtIQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUN0QixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpSEFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDcEIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsa0hBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDdkIsQ0FBQyxFQUFFLDJEQUFDLENBQUMsQ0FBQyxjQUFVLENBQUMsMkRBQUMsQ0FBQyxDQUFDLENBQUMsY0FBVSxDQUFDLENBQUMsMkRBQUMsQ0FBQyxDQUFDLGNBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDJEQUFDLENBQUMsQ0FBQyxDQUFDLGNBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzdFLENBQUMsRUFBRSwyREFBQyxDQUFDLENBQUMsZUFBVyxDQUFDLDREQUFFLENBQUMsQ0FBQyxDQUFDLGNBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3ZDLENBQUMsRUFBRSwyREFBQyxDQUFDLENBQUMsZUFBVyxDQUFDLHNJQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQyxDQUFDLEVBQUUsMkRBQUMsQ0FBQyxDQUFDLENBQUMsZUFBVyxDQUFDLDREQUFFLENBQUMsQ0FBQyxjQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUN2QyxDQUFDLEVBQUUsMkRBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2xDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsa0hBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3ZCLENBQUMsRUFBRSwyREFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3BDLENBQUMsRUFBRSwyREFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2xDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLDREQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNuQyxDQUFDLEVBQUUsMkRBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbkMsQ0FBQyxFQUFFLDJEQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFTLENBQUMsNERBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzNDLENBQUMsRUFBRSwyREFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBUyxDQUFDLDREQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMzQyxDQUFDLEVBQUUsMkRBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVMsQ0FBQyw0REFBRSxDQUFDLENBQUMsQ0FBQyxZQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUN6QyxDQUFDLEVBQUUsOEhBQVEsQ0FBQywrSEFBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3BDLENBQUMsRUFBRSw4SEFBUSxDQUFDLCtIQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQyxDQUFDLEVBQUUsOEhBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsOEhBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3BDLENBQUMsRUFBRSw4SEFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLDhIQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQyxDQUFDLEVBQUUsOEhBQVEsQ0FBQyw0REFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBUyxDQUFDLDREQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUM3RCxDQUFDLEVBQUUsQ0FBQywyREFBQyxDQUFDLENBQUMsQ0FBQyxhQUFTLENBQUMsRUFBRSxDQUFDLDJEQUFDLENBQUMsQ0FBQyxDQUFDLGFBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLDJEQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3RGLENBQUMsRUFBRSw4SEFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsOEhBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLDhIQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7TUFDdEYsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsK0hBQVMsQ0FBQyw4SEFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsOEhBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtNQUN0RixDQUFDLEVBQUUsaUhBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNyQixDQUFDLEVBQUUsaUhBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZm9vLmh0bWw6MCAob3JpZ2luYWwpLm1hcCIsInNvdXJjZVJvb3QiOiJodHRwOi8vZXhhbXBsZS5jb20vIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgICBpZiAodG9wICE9IHNlbGYpIHJ1bigpXG4gICAgICBpZiAodG9wIT1zZWxmKSBydW4oKVxuICAgICAgaWYgKHNlbGYgIT09IHRvcCkgcnVuKClcbiAgICAgIGlmIChzZWxmIT09dG9wKSBydW4oKVxuICAgICAgaWYgKHNlbGYgPT09IHRvcCkgcmV0dXJuXG4gICAgICBpZiAodG9wLmxvY2F0aW9uIT1zZWxmLmxvY2F0aW9uJiYodG9wLmxvY2F0aW9uLmhyZWY9c2VsZi5sb2NhdGlvbi5ocmVmKSkgcnVuKClcbiAgICAgIGlmICh0b3AubG9jYXRpb24gIT0gc2VsZi5sb2NhdGlvbikgcnVuKClcbiAgICAgIGlmICh0b3AubG9jYXRpb24gIT0gbG9jYXRpb24pIHJ1bigpXG4gICAgICBpZiAoc2VsZi5sb2NhdGlvbiAhPSB0b3AubG9jYXRpb24pIHJ1bigpXG4gICAgICBpZiAocGFyZW50LmZyYW1lcy5sZW5ndGggPiAwKSBydW4oKVxuICAgICAgaWYgKHdpbmRvdyAhPSB0b3ApIHJ1bigpXG4gICAgICBpZiAod2luZG93LnRvcCAhPT0gd2luZG93LnNlbGYpIHJ1bigpXG4gICAgICBpZiAod2luZG93LnRvcCE9PXdpbmRvdy5zZWxmKSBydW4oKVxuICAgICAgaWYgKHdpbmRvdy5zZWxmICE9IHdpbmRvdy50b3ApIHJ1bigpXG4gICAgICBpZiAod2luZG93LnRvcCAhPSB3aW5kb3cuc2VsZikgcnVuKClcbiAgICAgIGlmICh3aW5kb3dbXCJ0b3BcIl0gIT0gd2luZG93W1wicGFyZW50XCJdKSBydW4oKVxuICAgICAgaWYgKHdpbmRvd1sndG9wJ10gIT0gd2luZG93WydwYXJlbnQnXSkgcnVuKClcbiAgICAgIGlmICh3aW5kb3dbXCJ0b3BcIl0gIT0gc2VsZlsncGFyZW50J10pIHJ1bigpXG4gICAgICBpZiAocGFyZW50ICYmIHBhcmVudCAhPSB3aW5kb3cpIHJ1bigpXG4gICAgICBpZiAocGFyZW50ICYmIHBhcmVudCAhPSBzZWxmKSBydW4oKVxuICAgICAgaWYgKHBhcmVudCAmJiB3aW5kb3cgIT0gcGFyZW50KSBydW4oKVxuICAgICAgaWYgKHBhcmVudCAmJiBzZWxmICE9IHBhcmVudCkgcnVuKClcbiAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LmZyYW1lcyAmJiBwYXJlbnQuZnJhbWVzLmxlbmd0aCA+IDApIHJ1bigpXG4gICAgICBpZiAoKHNlbGYucGFyZW50ICYmICEoc2VsZi5wYXJlbnQgPT09IHNlbGYpKSAmJiAoc2VsZi5wYXJlbnQuZnJhbWVzLmxlbmd0aCAhPSAwKSkgcnVuKClcbiAgICAgIGlmIChwYXJlbnQgIT09IG51bGwgJiYgcGFyZW50LnRhZyAhPT0gJ0hvc3RDb21wb25lbnQnICYmIHBhcmVudC50YWcgIT09ICdIb3N0Um9vdCcpIHsgfVxuICAgICAgaWYgKG51bGwgIT09IHBhcmVudCAmJiBwYXJlbnQudGFnICE9PSAnSG9zdENvbXBvbmVudCcgJiYgcGFyZW50LnRhZyAhPT0gJ0hvc3RSb290JykgeyB9XG4gICAgICBpZiAodG9wPT09c2VsZikgcmV0dXJuXG4gICAgICBpZiAodG9wPT1zZWxmKSByZXR1cm5cbiAgICAiXX0=</script>
  </body>
</html>
`

exports['lib/html .rewriteHtmlJs with inline scripts rewrites inline JS with no type 1'] = `
<script>globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top')
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvby5odG1sOjAgKG9yaWdpbmFsKSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiMERBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImZvby5odG1sOjAgKG9yaWdpbmFsKS5tYXAiLCJzb3VyY2VSb290IjoiaHR0cDovL2V4YW1wbGUuY29tLyIsInNvdXJjZXNDb250ZW50IjpbIndpbmRvdy50b3AiXX0=</script>
`

exports['lib/html .rewriteHtmlJs with inline scripts rewrites inline JS with type 1'] = `
<script type="text/javascript">globalThis.top.Cypress.resolveWindowReference(globalThis, window, 'top')
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvby5odG1sOjAgKG9yaWdpbmFsKSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiMERBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImZvby5odG1sOjAgKG9yaWdpbmFsKS5tYXAiLCJzb3VyY2VSb290IjoiaHR0cDovL2V4YW1wbGUuY29tLyIsInNvdXJjZXNDb250ZW50IjpbIndpbmRvdy50b3AiXX0=</script>
`

exports['lib/html .rewriteHtmlJs with inline scripts does not rewrite non-JS inline 1'] = `
<script type="x-foo/bar">window.top</script>
`
