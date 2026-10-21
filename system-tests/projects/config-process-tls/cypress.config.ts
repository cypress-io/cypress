import https from 'https'

const url = `https://localhost:${process.env.TLS_SERVER_PORT}/`

export default {
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      on('task', {
        nodeTlsRejectUnauthorized () {
          return process.env.NODE_TLS_REJECT_UNAUTHORIZED ?? null
        },
        httpsGet () {
          return new Promise((resolve) => {
            https.get(url, (res) => {
              res.resume()
              res.on('end', () => resolve('connected'))
            }).on('error', (err: NodeJS.ErrnoException) => resolve(`refused: ${err.code}`))
          })
        },
        async fetch () {
          try {
            await fetch(url)

            return 'connected'
          } catch (err) {
            return `refused: ${err.cause?.code ?? err.message}`
          }
        },
      })
    },
  },
}
