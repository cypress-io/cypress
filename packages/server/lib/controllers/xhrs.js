/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _           = require("lodash");
const mime        = require("mime");
const Promise     = require("bluebird");
const fixture     = require("../fixture");

const fixturesRe = /^(fx:|fixture:)/;
const htmlLikeRe = /<.+>[\s\S]+<\/.+>/;

const isValidJSON = function(text) {
  if (_.isObject(text)) { return true; }

  try {
    const o = JSON.parse(text);
    return _.isObject(o);
  } catch (error) {
    false;
  }

  return false;
};

module.exports = {
  handle(req, res, config, next) {
    const get = function(val, def) {
      let left;
      return decodeURI((left = req.get(val)) != null ? left : def);
    };

    const delay    = ~~get("x-cypress-delay");
    const status   = get("x-cypress-status", 200);
    let headers  = get("x-cypress-headers", null);
    const response = get("x-cypress-response", "");

    const respond = () => {
      //# figure out the stream interface and pipe these
      //# chunks to the response
      return this.getResponse(response, config)
      .then((resp = {}) => {
        let { data, encoding } = resp;

        //# grab content-type from x-cypress-headers if present
        headers = this.parseHeaders(headers, data);

        //# enable us to respond with other encodings
        //# like binary
        if (encoding == null) { encoding = "utf8"; }

        //# TODO: if data is binary then set
        //# content-type to binary/octet-stream
        if (_.isObject(data)) {
          data = JSON.stringify(data);
        }

        //# when data is null, JSON.stringify returns null.
        //# handle that case. 
        if (data === null) {
          data = '';
        }

        const chunk = Buffer.from(data, encoding);

        headers["content-length"] = chunk.length;

        return res
        .set(headers)
        .status(status)
        .end(chunk);
    }).catch(err => res
      .status(400)
      .send({__error: err.stack}));
    };

    if (delay > 0) {
      return Promise.delay(delay).then(respond);
    } else {
      return respond();
    }
  },

  _get(resp, config) {
    const options = {};

    const file = resp.replace(fixturesRe, "");

    const [filePath, encoding] = file.split(",");

    if (encoding) {
      options.encoding = encoding;
    }

    return fixture.get(config.fixturesFolder, filePath, options)
    .then(bytes => ({
      data: bytes,
      encoding
    }));
  },

  getResponse(resp, config) {
    if (fixturesRe.test(resp)) {
      return this._get(resp, config);
    } else {
      return Promise.resolve({data: resp});
    }
  },

  parseContentType(response) {
    const ret = type => //+ "; charset=utf-8"
    mime.getType(type);

    switch (false) {
      case !isValidJSON(response):
        return ret("json");
      case !htmlLikeRe.test(response):
        return ret("html");
      default:
        return ret("text");
    }
  },

  parseHeaders(headers, response) {
    try {
      headers = JSON.parse(headers);
    } catch (error) {}

    if (headers == null) { headers = {}; }
    if (headers["content-type"] == null) { headers["content-type"] = this.parseContentType(response); }

    return headers;
  }

};
