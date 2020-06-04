/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const bodyParser = require("body-parser");
const e2e        = require("../support/helpers/e2e").default;

const onServer = function(app) {
  app.use(bodyParser.json());

  app.get("/", (req, res) => res.send("<html>hi there</html>"));

  app.post("/login", (req, res) => //# respond with JSON with exactly what the
  //# request body was and all of the request headers
  res.json({
    body: req.body,
    headers: req.headers
  }));

  return app.post("/html", (req, res) => res.json({content: "<html>content</html>"}));
};

describe("e2e xhr", function() {
  e2e.setup({
    servers: {
      port: 1919,
      onServer
    }
  });

  e2e.it("passes in global mode", {
    spec: "xhr_spec.coffee",
    snapshot: true
  });

  return e2e.it("passes through CLI", {
    spec: "xhr_spec.coffee",
    snapshot: true,
    useCli: true
  });
});
