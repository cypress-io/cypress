// eslint-disable-next-line no-undef
importScripts('/ww.js')

self.addEventListener('connect', (event) => {
  const port = event.ports[0]

  port.onmessage = (e) => {
    if (e.data.foo === 'baz') {
      port.postMessage({
        foo: 'baz2',
      })
    }
  }
})
