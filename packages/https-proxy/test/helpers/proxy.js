/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { allowDestroy } = require("@packages/network");
const http       = require("http");
const path       = require("path");
const httpsProxy = require("../../lib/proxy");

let prx = null;

const pipe = (req, res) => req.pipe(request(req.url))
.on("error", function() {
  console.log("**ERROR**", req.url);
  req.statusCode = 500;
  return res.end();
}).pipe(res);

const onConnect = (req, socket, head, proxy) => proxy.connect(req, socket, head, {
  onDirectConnection(req, socket, head) {
    return ["localhost:8444", "localhost:12344"].includes(req.url);
  }
});

const onRequest = (req, res) => pipe(req, res);

module.exports = {
  reset() {
    return httpsProxy.reset();
  },

  start(port) {
    prx = http.createServer();

    allowDestroy(prx);

    const dir = path.join(process.cwd(), "ca");

    return httpsProxy.create(dir, port, {
      onUpgrade(req, socket, head) {},

      onRequest(req, res) {
        console.log("ON REQUEST FROM OUTER PROXY", req.url, req.headers, req.method);

        if (req.url.includes("replace")) {
          const {
            write
          } = res;
          res.write = function(chunk) {
            chunk = Buffer.from(chunk.toString().replace("https server", "replaced content"));

            return write.call(this, chunk);
          };

          return pipe(req, res);
        } else {
          return pipe(req, res);
        }
      }
    })
    .then(proxy => {
      prx.on("request", onRequest);

      prx.on("connect", (req, socket, head) => onConnect(req, socket, head, proxy));

      return new Promise(resolve => prx.listen(port, function() {
        prx.proxy = proxy;
        console.log(`server listening on port: ${port}`);
        return resolve(proxy);
      }));
    });
  },

  stop() {
    return new Promise(resolve => prx.destroy(resolve)).then(() => prx.proxy.close());
  }
};
