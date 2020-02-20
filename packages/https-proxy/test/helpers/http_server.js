/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const http      = require("http");
const Promise   = require("bluebird");

const srv = http.createServer(function(req, res) {
  console.log("HTTP SERVER REQUEST URL:", req.url);
  console.log("HTTP SERVER REQUEST HEADERS:", req.headers);

  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  return res.end("<html><body>http server</body></html>");
});

module.exports = {
  srv,

  start() {
    return new Promise(resolve => srv.listen(8080, function() {
      console.log("server listening on port: 8080");
      return resolve(srv);
    }));
  },

  stop() {
    return new Promise(resolve => srv.close(resolve));
  }
};