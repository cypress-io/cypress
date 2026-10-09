// Certificate material is generated into `certs/` by the system test before Cypress
// starts. `clientCertificates` paths must be relative — absolute paths are rejected by
// config validation — and they resolve against the server process cwd, which is this
// project directory.
export default {
  e2e: {
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.ts',
  },
  clientCertificates: [
    {
      url: `https://localhost:${process.env.MTLS_PORT}`,
      ca: ['certs/origin-ca.crt'],
      certs: [
        {
          cert: 'certs/client.crt',
          key: 'certs/client.key',
        },
      ],
    },
    {
      url: `https://localhost:${process.env.MTLS_PORT_2}`,
      ca: ['certs/origin-ca.crt'],
      certs: [
        {
          cert: 'certs/client.crt',
          key: 'certs/client.key',
        },
      ],
    },
  ],
  expose: {
    MTLS_ORIGIN: `https://localhost:${process.env.MTLS_PORT}`,
    MTLS_ORIGIN_2: `https://localhost:${process.env.MTLS_PORT_2}`,
  },
}
