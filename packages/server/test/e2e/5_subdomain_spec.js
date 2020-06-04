/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const cors     = require("cors");
const parser   = require("cookie-parser");
const session  = require("express-session");
const e2e      = require("../support/helpers/e2e").default;

const onServer = function(app) {
  app.use(parser());

  app.use(function(req, res, next) {
    console.log("** REQUEST HEADERS ARE", req.url, req.headers);
    return next();
  });

  const getIndex = () => `\
<!DOCTYPE html>
<html>
<head>
</head>
<body>
<ul>
  <li>
    <a href="http://help.foobar.com:2292">switch to http://help.foobar.com</a>
  </li>
</ul>
</body>
</html>\
`;

  const getText = text => `\
<!DOCTYPE html>
<html>
<head>
</head>
<body>
<h1>${text}</h1>
</body>
</html>\
`;

  const applySession = session({
    name: "secret-session",
    secret: "secret",
    cookie: {
      sameSite: true
    }
  });

  app.get("/htmlCookies", function(req, res) {
    const {
      cookie
    } = req.headers;

    return res.send(`<html><div id='cookie'>${cookie}</div></html>`);
  });

  app.get("/cookies*", cors({origin: true, credentials: true}), (req, res) => res.json({
    cookie: req.headers["cookie"],
    parsed: req.cookie
  }));

  app.get("/redirect", (req, res) => res.redirect("http://www.foobar.com:2292/cookies"));

  app.get("/domainRedirect", (req, res) => res.redirect("http://www.foobar.com:2292/htmlCookies"));

  return app.get("*", function(req, res, next) {
    res.set('Content-Type', 'text/html');

    const getHtml = () => {
      let h;
      switch ((h = req.get("host"))) {
        case "www.foobar.com:2292":
          return getIndex();

        case "help.foobar.com:2292":
          return getText("Help");

        case "session.foobar.com:2292":
          applySession(req, res, next);

          return getText("Session");

        case "domain.foobar.com:2292":
          res.cookie("nomnom", "good", {
            domain: ".foobar.com"
          });

          return getText("Domain");

        case "qa.sub.foobar.com:2292": case "staging.sub.foobar.com:2292":
          return getText("Nested Subdomains");

        default:
          throw new Error(`Host: '${h}' not recognized`);
      }
    };

    return res.send(getHtml());
  });
};

describe("e2e subdomain", function() {
  e2e.setup({
    servers: {
      port: 2292,
      onServer
    }
  });

  return e2e.it("passes", {
    spec: "subdomain_spec.coffee",
    snapshot: true,
    config: {
      hosts: {
        "*.foobar.com": "127.0.0.1"
      }
    }
  });
});
