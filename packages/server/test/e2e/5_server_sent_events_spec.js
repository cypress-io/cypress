/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const SseStream = require("ssestream");
const e2e = require("../support/helpers/e2e").default;

let clients = 0;

const onServer = function(app, srv) {
  app.get("/clients", (req, res) => res.json({ clients }));

  app.get("/foo", (req, res) => res.send("<html>foo></html>"));

  return app.get("/sse", (req, res) => req.socket.destroy());
};

const onSSEServer = app => app.get("/sse", function(req, res) {
  let int;
  clients += 1;

  res.on("close", function() {
    clearInterval(int);
    return clients -= 1;
  });

  res.set({
    "Access-Control-Allow-Origin": "*"
  });

  this.sseStream = new SseStream(req);
  this.sseStream.pipe(res);

  let i = 0;

  return int = setInterval(() => {
    i += 1;

    return this.sseStream.write({
      data: "" + i
    });
  }
  , 100);
});

const onSSEsServer = function(app) {};

describe("e2e server sent events", function() {
  e2e.setup({
    servers: [{
      port: 3038,
      static: true,
      onServer
    }, {
      port: 3039,
      onServer: onSSEServer
    }, {
      port: 3040,
      onServer: onSSEsServer
    }]
  });

  //# https://github.com/cypress-io/cypress/issues/1440
  return e2e.it("passes", {
    spec: "server_sent_events_spec.coffee",
    snapshot: true
  });
});
