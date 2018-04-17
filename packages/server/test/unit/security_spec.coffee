require("../spec_helper")

_ = require("lodash")
rp = require("request-promise")
concat = require("concat-stream")
fs = require("#{root}lib/util/fs")
security = require("#{root}lib/util/security")
Fixtures = require("#{root}test/support/helpers/fixtures")

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

    it "replaces jira window getter", ->
      jira = """
        for (; !function (n) {
          return n === n.parent
        }(n)
      """

      jira2 = """
        function(n){for(;!function(l){return l===l.parent}(l)&&function(l){try{if(void 0==l.location.href)return!1}catch(l){return!1}return!0}(l.parent);)l=l.parent;return l}
      """

      expect(security.strip(jira)).to.eq("""
        for (; !function (n) {
          return n === n.parent || n.parent.__Cypress__
        }(n)
      """)

      expect(security.strip(jira2)).to.eq("""
        function(n){for(;!function(l){return l===l.parent || l.parent.__Cypress__}(l)&&function(l){try{if(void 0==l.location.href)return!1}catch(l){return!1}return!0}(l.parent);)l=l.parent;return l}
      """)

    describe "libs", ->
      ## go out and download all of these libs and ensure
      ## that we can run them through the security strip
      ## and that they are not modified!

      cdnUrl = "https://cdnjs.cloudflare.com/ajax/libs"

      needsDash = ["backbone", "underscore"]

      libs = {
        jquery: "#{cdnUrl}/jquery/3.3.1/jquery.js"
        jqueryui: "#{cdnUrl}/jqueryui/1.12.1/jquery-ui.js"
        angular: "#{cdnUrl}/angular.js/1.6.5/angular.js"
        bootstrap: "#{cdnUrl}/twitter-bootstrap/4.0.0/js/bootstrap.js"
        fontawesome: "#{cdnUrl}/font-awesome/4.7.0/css/font-awesome.css"
        moment: "#{cdnUrl}/moment.js/2.20.1/moment.js"
        lodash: "#{cdnUrl}/lodash.js/4.17.5/lodash.js"
        vue: "#{cdnUrl}/vue/2.5.13/vue.js"
        backbone: "#{cdnUrl}/backbone.js/1.3.3/backbone.js"
        cycle: "#{cdnUrl}/cyclejs-core/7.0.0/cycle.js"
        d3: "#{cdnUrl}/d3/4.13.0/d3.js"
        normalize: "#{cdnUrl}/normalize/8.0.0/normalize.css"
        underscore: "#{cdnUrl}/underscore.js/1.8.3/underscore.js"
        foundation: "#{cdnUrl}/foundation/6.4.3/js/foundation.js"
        require: "#{cdnUrl}/require.js/2.3.5/require.js"
        rxjs: "#{cdnUrl}/rxjs/5.5.6/Rx.js"
        bluebird: "#{cdnUrl}/bluebird/3.5.1/bluebird.js"
      }

      libs = _
      .chain(libs)
      .clone()
      .reduce (memo, url, lib) ->
        memo[lib] = url
        memo[lib + "Min"] = url
          .replace(/js$/, "min.js")
          .replace(/css$/, "min.css")

        if lib in needsDash
          memo[lib + "Min"] = url.replace("min", "-min")

        memo
      , {}
      .extend({
        knockoutDebug: "#{cdnUrl}/knockout/3.4.2/knockout-debug.js"
        knockoutMin: "#{cdnUrl}/knockout/3.4.2/knockout-min.js"
        emberMin: "#{cdnUrl}/ember.js/2.18.2/ember.min.js"
        emberProd: "#{cdnUrl}/ember.js/2.18.2/ember.prod.js"
        reactDev: "#{cdnUrl}/react/16.2.0/umd/react.development.js"
        reactProd: "#{cdnUrl}/react/16.2.0/umd/react.production.min.js"
        vendorBundle: "https://s3.amazonaws.com/assets.cypress.io/vendor.bundle.js"
        hugeApp: "https://s3.amazonaws.com/assets.cypress.io/huge_app.js"
      })
      .value()

      _.each libs, (url, lib) ->
        it "does not alter code from: '#{lib}'", ->
          nock.enableNetConnect()

          @timeout(10000)

          pathToLib = Fixtures.path("server/libs/#{lib}")

          downloadFile = ->
            rp(url)
            .then (resp) ->
              fs
              .outputFileAsync(pathToLib, resp)
              .return(resp)
          fs
          .readFileAsync(pathToLib, "utf8")
          .catch(downloadFile)
          .then (libCode) ->
            stripped = security.strip(libCode)
            ## nothing should have changed!
            try
              expect(stripped).to.eq(libCode)
            catch err
              fs.outputFileSync(pathToLib + "Diff", stripped)
              throw new Error("code from '#{lib}' was different")

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
