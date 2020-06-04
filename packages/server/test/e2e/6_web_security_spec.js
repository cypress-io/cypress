/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const str = require("underscore.string");
const e2e = require("../support/helpers/e2e").default;

const onServer = function(app) {
  app.get("/link", (req, res) => res.send("<html><h1>link</h1><a href='https://www.foo.com:44665/cross_origin'>second</a></html>"));

  app.get("/cross_origin", (req, res) => res.send("<html><h1>cross origin</h1></html>"));

  app.get("/form", (req, res) => res.send(`\
<html>
<h1>form</h1>
<form method='POST' action='https://www.foo.com:44665/submit'>
  <input type='submit' name='foo' value='bar' />
</form>
</html>\
`));

  app.post("/submit", (req, res) => res.redirect("https://www.foo.com:44665/cross_origin"));

  return app.get("/javascript", (req, res) => res.send(`\
<html>
<script type='text/javascript'>
  window.redirect = function(){
    debugger
    window.location.href = 'https://www.foo.com:44665/cross_origin'
  }
</script>
<h1>javascript</h1>
<button onclick='redirect()'>click me</button>
</html>\
`));
};

describe("e2e web security", function() {

  context("when enabled", function() {
    e2e.setup({
      servers: [{
        port: 4466,
        onServer
      }, {
        port: 44665,
        https: true,
        onServer
      }],
      settings: {
        hosts: {
          "*.foo.com": "127.0.0.1"
        }
      }
    });

    return e2e.it("fails", {
      spec: "web_security_spec.coffee",
      snapshot: true,
      expectedExitCode: 3
    });
});

  return context("when disabled", function() {
    e2e.setup({
      servers: [{
        port: 4466,
        onServer
      }, {
        port: 44665,
        https: true,
        onServer
      }],
      settings: {
        chromeWebSecurity: false,
        hosts: {
          "*.foo.com": "127.0.0.1"
        }
      }
    });

    return e2e.it("passes", {
      spec: "web_security_spec.coffee",
      snapshot: true,
      browser: ['chrome', 'electron']
    });
});
});

context('firefox', function() {
  e2e.setup({
    settings: {
      chromeWebSecurity: false
    }
  });
  return e2e.it("displays warning when firefox and chromeWebSecurity:false", {
    spec: "simple_passing_spec.coffee",
    snapshot: true,
    browser: 'firefox',
    onStdout(stdout) {
      return expect(stdout).include('Your project has set the configuration option: `chromeWebSecurity: false`\n\nThis option will not have an effect in Firefox.');
    }
  });
});
