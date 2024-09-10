import { server } from './src/server'
import { certificates } from './scripts/generateCerts'

module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      on('before:run', async () => {
        await certificates.generate()
        await server.start()
      })

      on('after:run', async () => {
        await server.stop()
        await certificates.clean()
      })

      return config
    },
    clientCertificates: [
      {
        url: 'https://localhost:3000',
        ca: ['certs/ca.crt'],
        certs: [
          {
            group: 'user',
            cert: 'certs/user.crt',
            key: 'certs/user.key',
          },
          {
            group: 'admin',
            cert: 'certs/admin.crt',
            key: 'certs/admin.key',
          },
        ],
      },
    ],
  },
}
