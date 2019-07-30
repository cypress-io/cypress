// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const moment = require('moment')
const parser = require('cookie-parser')
const e2e = require('../support/helpers/e2e')
const humanInterval = require('human-interval')

const onServer = function (app) {
  app.use(parser())

  app.get('/logout', (req, res) => {
    return res.send('<html>logged out</html>')
  })

  app.get('/requestCookies', (req, res) => {
    return res.send(req.cookies)
  })

  app.get('/set', (req, res) => {
    res.cookie('shouldExpire', 'endOfsession')

    return res.send('<html></html>')
  })

  app.get('/setOneHourFromNowAndSecure', (req, res) => {
    res.cookie('shouldExpire', 'oneHour', {
      secure: true,
      maxAge: humanInterval('1 hour'),
    })

    return res.send('<html></html>')
  })

  app.get('/expirationRedirect', (req, res) => {
    res.cookie('shouldExpire', 'now', {
      //# express maxAge is relative to current time
      //# in milliseconds
      maxAge: 0,
    })

    return res.redirect('/logout')
  })

  app.get('/expirationMaxAge', (req, res) => {
    res.header('Set-Cookie',
      'shouldExpire=; Max-Age=0; Path=/; Expires=Sun, 24 Jun 1997 20:36:13 GMT')
    //# response to set
    // auth=p1_2FruNr1entizk9QEGHFYQlWjIK5LULzdDj17lkYhZTz7XA5GOfnVgbbeBDAqnfImkwof2qz0M3yi3AUVusKPqh1BRK6253h0kiBENwdjWDsx3mYQQKpHn6o3XOXX7poSkzrHThnrDlH4w9zoLItwIVNhR2hQrCYhQhtHuw20YM_3D; Domain=.surveymonkey.com;Max-Age=3600; Path=/; expires=Fri, 26-Oct-2018 06:13:48 GMT; secure; HttpOnly'

    //# response to clear
    // auth=; Domain=.surveymonkey.com; Max-Age=0; Path=/; expires=Wed, 31-Dec-97 23:59:59 GMT

    return res.send('<html></html>')
  })

  app.get('/expirationExpires', (req, res) => {
    res.cookie('shouldExpire', 'now', {
      expires: moment().subtract(1, 'day').toDate(),
    })

    return res.send('<html></html>')
  })

  app.get('/cookieWithNoName', (req, res) => {
    res.header('Set-Cookie',
      '=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/')

    return res.send('<html></html>')
  })

  return app.get('/invalidCookies', (req, res) => {
    res.header('Set-Cookie', 'foo=bar; domain=nope.not.this.one')

    return res.send('<html></html>')
  })
}

describe('e2e cookies', () => {
  e2e.setup({
    servers: [{
      onServer,
      port: 2121,
    }, {
      onServer,
      port: 2323,
      https: true,
    }],
    settings: {
      baseUrl: 'https://localhost:2323/',
    },
  })

  it('passes', function () {
    return e2e.exec(this, {
      spec: 'cookies_spec.coffee',
      snapshot: true,
      expectedExitCode: 0,
    })
  })
})
