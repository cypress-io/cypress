// eslint-disable-next-line no-undef
importScripts('/ww.js')

postMessage({
  foo: 'bar',
})

onmessage = (e) => {
  if (e.data.foo === 'bar') {
    postMessage({
      foo: 'bar2',
    })
  }
}
