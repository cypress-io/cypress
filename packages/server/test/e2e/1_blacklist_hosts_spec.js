/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

const onServer = function(app) {
  app.get("/", (req, res) => res.send("<html>hi there</html>"));

  app.get("/req", (req, res) => res.sendStatus(200));

  return app.get("/status", (req, res) => res.sendStatus(503));
};

describe("e2e blacklist", function() {
  e2e.setup({
    servers: [{
      port: 3131,
      onServer
    }, {
      port: 3232,
      onServer
    }],
    settings: {
      baseUrl: "http://localhost:3232",
      blacklistHosts: "localhost:3131"
    }
  });

  return it("passes", function() {
    return e2e.exec(this, {
      spec: "blacklist_hosts_spec.coffee",
      snapshot: true
    });
  });
});
