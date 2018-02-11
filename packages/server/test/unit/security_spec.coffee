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
      if (parent && parent != window) run()
      if (parent && parent.frames && parent.frames.length > 0) run()
      if ((self.parent && !(self.parent === self)) && (self.parent.frames.length != 0)) run()
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
      if (self && self != window) run()
      if (self && self.frames && self.frames.length > 0) run()
      if ((self.self && !(self.self === self)) && (self.self.frames.length != 0)) run()
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
