const HOST = 'CHANGE_ME_HOST'
const PATH = 'CHANGE_ME_PATH'

console.log('🟣 from service worker', { HOST, PATH })
console.log('🟢 modded')

try {
  console.log('EventSource:', EventSource)
} catch (err) {
  console.log('🔴 error on EventSource:', err)
}

try {
  console.log('window.EventSource:', window.EventSource)
} catch (err) {
  console.log('🔴 error on window.EventSource:', err)
}

// const evtSource = new EventSource("ssedemo.php");

// ;(async () => {

// })()
