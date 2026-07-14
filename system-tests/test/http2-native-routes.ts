import type { Http2NativeRegister } from '../lib/http2-native-server'
import { respondHtml, respondJson } from '../lib/http2-native-server'

export const HTTP2_NATIVE_PORT = 44701

export const HTTP2_NATIVE_ORIGIN = `https://www.h2test.local:${HTTP2_NATIVE_PORT}`

export function registerHttp2NativeRoutes (register: Http2NativeRegister) {
  // NOTE: HTTP/2 server push is deprecated in Chromium in favor of `<link rel="preload">`
  // and 103 Early Hints (https://developer.chrome.com/blog/removing-push). These routes
  // still validate push handling for the CDP Fetch program while browsers honor push.
  register('GET', '/push-page', (stream) => {
    stream.pushStream({ ':path': '/push/pushed.js' }, (err, pushStream) => {
      if (err) {
        return
      }

      pushStream.respond({
        ':status': 200,
        'content-type': 'application/javascript',
      })

      pushStream.end('window.__PUSHED__ = true')
    })

    respondHtml(stream, 200, `\
<html>
  <body>
    <div id="result">loading</div>
    <script src="/push/pushed.js"></script>
    <script>
      document.getElementById('result').textContent = window.__PUSHED__ ? 'pushed' : 'fail'
    </script>
  </body>
</html>`)
  })

  register('GET', '/priority', (stream) => {
    respondHtml(stream, 200, `\
<html>
  <body>
    <div id="order"></div>
    <script>
      const order = []
      const origin = '${HTTP2_NATIVE_ORIGIN}'

      function complete (id) {
        order.push(id)
        document.getElementById('order').textContent = order.join(',')
      }

      fetch(origin + '/priority-item?id=0&ms=300', { priority: 'low' })
        .then(() => complete(0))
      fetch(origin + '/priority-item?id=1&ms=300', { priority: 'low' })
        .then(() => complete(1))
      fetch(origin + '/priority-item?id=2&ms=300', { priority: 'low' })
        .then(() => complete(2))

      fetch(origin + '/priority-item?id=3', { priority: 'high' })
        .then(() => complete(3))
      fetch(origin + '/priority-item?id=4', { priority: 'high' })
        .then(() => complete(4))
      fetch(origin + '/priority-item?id=5', { priority: 'high' })
        .then(() => complete(5))
    </script>
  </body>
</html>`)
  })

  register('GET', '/priority-item', (stream, headers) => {
    const url = new URL(String(headers[':path']), HTTP2_NATIVE_ORIGIN)
    const id = Number(url.searchParams.get('id'))
    const delayMs = Number(url.searchParams.get('ms')) || 0
    const body = { id }

    const send = () => respondJson(stream, 200, body)

    if (delayMs > 0) {
      setTimeout(send, delayMs)

      return
    }

    send()
  })

  register('GET', '/settings', (stream) => {
    const { session } = stream

    respondJson(stream, 200, {
      protocol: '2.0',
      localSettings: session.localSettings,
      remoteSettings: session.remoteSettings,
    })
  })
}
