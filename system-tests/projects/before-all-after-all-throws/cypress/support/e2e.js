const origConsoleLog = console.log.bind(console)

console.log = (...args) => {
  const port = Cypress.expose('SYNC_STDERR_LOG_PORT')

  if (!port) {
    return origConsoleLog(...args)
  }

  const line = args.map((a) => {
    if (typeof a === 'string') {
      return a
    }

    try {
      return JSON.stringify(a)
    } catch {
      return String(a)
    }
  }).join(' ')

  try {
    const xhr = new XMLHttpRequest()

    xhr.open('POST', `http://127.0.0.1:${port}/log`, false)
    xhr.setRequestHeader('Content-Type', 'text/plain')
    xhr.send(line)
  } catch {
    origConsoleLog(...args)
  }
}

Cypress.on('test:after:run', () => {
  console.log('test:after:run')
})

Cypress.on('test:after:run:async', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log('test:after:run:async')
})
