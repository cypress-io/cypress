/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ws = require("ws");

const e2e = require("../support/helpers/e2e").default;

const onServer = app => app.get("/foo", (req, res) => res.send("<html>foo></html>"));

const onWsServer = function(app, server) {
  const wss = new ws.Server({ server });
  return wss.on("connection", ws => ws.on("message", msg => ws.send(msg + "bar")));
};

const onWssServer = function(app) {};

describe("e2e websockets", function() {
  e2e.setup({
    servers: [{
      port: 3038,
      static: true,
      onServer
    }, {
      port: 3039,
      onServer: onWsServer
    }, {
      port: 3040,
      onServer: onWssServer
    }]
  });

  //# https://github.com/cypress-io/cypress/issues/556
  return e2e.it("passes", {
    spec: "websockets_spec.coffee",
    snapshot: true
  });
});
