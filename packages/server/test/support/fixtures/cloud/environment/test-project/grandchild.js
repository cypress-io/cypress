// eslint-disable-next-line no-console
console.log('grandchild', process.pid, process.ppid, process.env.GRANDCHILD_CYPRESS_API_URL)

const timeout = setTimeout(() => {

}, 1e9)

process.on('SIGTERM', () => {
  clearTimeout(timeout)
})
