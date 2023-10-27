onmessage = (e) => {
  // eslint-disable-next-line no-undef
  importScripts('/ww.js')

  if (e.data.foo === 'bar') {
    postMessage({
      foo: 'bar2',
    })
  }
}
