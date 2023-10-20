// eslint-disable-next-line no-undef
importScripts('/ww.js')

self.addEventListener('connect', (event) => {
  const port = event.ports[0]

  port.postMessage({
    foo: 'baz',
  })
})
