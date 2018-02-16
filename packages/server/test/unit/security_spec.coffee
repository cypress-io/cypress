require("../spec_helper")

concat = require("concat-stream")
security = require("#{root}lib/util/security")

original = """
<html>
  <body>
    top1
    settop
    settopbox
    parent1
    grandparent
    grandparents

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
      if (top.location != self.location) run()
      if (top.location != location) run()
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
</html>
"""

expected = """
<html>
  <body>
    top1
    settop
    settopbox
    parent1
    grandparent
    grandparents

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
      if (self != self) run()
      if (self!=self) run()
      if (self.location != self.location) run()
      if (self.location != location) run()
      if (self.frames.length > 0) run()
      if (window != self) run()
      if (window.self !== window.self) run()
      if (window.self!==window.self) run()
      if (window.self != window.self) run()
      if (window.self != window.self) run()
      if (window["self"] != window["self"]) run()
      if (window['self'] != window['self']) run()
      if (window["self"] != self['self']) run()
      if (parent && self != window) run()
      if (parent && self != self) run()
      if (parent && window != self) run()
      if (parent && self != self) run()
      if (parent && self.frames && self.frames.length > 0) run()
      if ((self.parent && !(self.self === self)) && (self.self.frames.length != 0)) run()
      if (parent !== null && parent.tag !== 'HostComponent' && parent.tag !== 'HostRoot') { }
      if (null !== parent && parent.tag !== 'HostComponent' && parent.tag !== 'HostRoot') { }
      if (self===self) return
      if (self==self) return
    </script>
  </body>
</html>
"""

describe "lib/util/security", ->
  context ".strip", ->
    it "replaces obstructive code", ->
      expect(security.strip(original)).to.eq(expected)

  context ".stripStream", ->
    it "replaces obstructive code", (done) ->
      haystacks = original.split("\n")

      replacer = security.stripStream()

      replacer.pipe concat {encoding: "string"}, (str) ->
        str = str.trim()

        try
          expect(str).to.eq(expected)
          done()
        catch err
          done(err)

      haystacks.forEach (haystack) ->
        replacer.write(haystack + "\n")

      replacer.end()
