import { parseContentType } from '@packages/net-stubbing/lib/server/util'
import _ from 'lodash'
import Promise from 'bluebird'
import fixture from '../fixture'

const fixturesRe = /^(fx:|fixture:)/

export = {
  handle (req, res, config, next) {
    const get = function (val, def?) {
      return decodeURI(req.get(val) || def)
    }

    const delay = ~~get('x-cypress-delay')
    const status = get('x-cypress-status', 200)
    let headers = get('x-cypress-headers', null)
    const response = get('x-cypress-response', '')

    const respond = () => {
      // figure out the stream interface and pipe these
      // chunks to the response
      return this.getResponse(response, config)
      .then((resp: { data: any, encoding?: BufferEncoding }) => {
        let { data, encoding } = resp

        // grab content-type from x-cypress-headers if present
        headers = this.parseHeaders(headers, data)

        // enable us to respond with other encodings
        // like binary
        if (encoding == null) {
          encoding = 'utf8'
        }

        // TODO: if data is binary then set
        // content-type to binary/octet-stream
        if (_.isObject(data)) {
          data = JSON.stringify(data)
        }

        // when data is null, JSON.stringify returns null.
        // handle that case.
        if (data === null) {
          data = ''
        }

        if (_.isNumber(data) || _.isBoolean(data)) {
          data = String(data)
        }

        const chunk = Buffer.from(data, encoding)

        headers['content-length'] = chunk.length

        return res
        .set(headers)
        .status(status)
        .end(chunk)
      }).catch((err: Error) => {
        return res
        .status(400)
        .send({ __error: err.stack })
      })
    }

    if (delay > 0) {
      return Promise.delay(delay).then(respond)
    }

    return respond()
  },

  _get (resp: string, config: { fixturesFolder: string }): Promise<{ data: any, encoding?: string }> {
    const options: { encoding?: string } = {}

    const file = resp.replace(fixturesRe, '')

    const [filePath, encoding] = file.split(',')

    if (encoding) {
      options.encoding = encoding
    }

    return fixture.get(config.fixturesFolder, filePath, options)
    .then((bytes: any) => {
      return {
        data: bytes,
        encoding,
      }
    })
  },

  getResponse (resp, config) {
    if (fixturesRe.test(resp)) {
      return this._get(resp, config)
    }

    return Promise.resolve({ data: resp })
  },

  parseHeaders (headers, response) {
    try {
      headers = JSON.parse(headers)
    } catch (error) {} // eslint-disable-line no-empty

    if (headers == null) {
      headers = {}
    }

    if (headers['content-type'] == null) {
      headers['content-type'] = parseContentType(response)
    }

    return headers
  },

}
