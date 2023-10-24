// eslint-disable-next-line no-undef
importScripts('/ww.js')

onmessage = (e) => {
  if (e.data.foo === 'bar') {
    postMessage({
      foo: 'bar2',
    })
  }
}
