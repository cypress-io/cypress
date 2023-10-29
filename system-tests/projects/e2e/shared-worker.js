self.onconnect = (event) => {
  const port = event.ports[0]

  port.onmessage = (e) => {
    // eslint-disable-next-line no-undef
    importScripts('/sw.js')

    if (e.data.foo === 'baz') {
      port.postMessage({
        foo: 'baz2',
      })
    }
  }
}
