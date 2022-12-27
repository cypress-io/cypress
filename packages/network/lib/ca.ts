import { promises as fs } from 'fs'
import tls from 'tls'

export type CaOptions = { ca?: string[] }

const getNpmConfigCAFileValue = (): Promise<string | undefined> => {
  if (process.env.npm_config_cafile) {
    return fs.readFile(process.env.npm_config_cafile, 'utf8').then((ca) => {
      return ca
    }).catch(() => {
      return undefined
    })
  }

  return Promise.resolve(undefined)
}
const getNodeExtraCACertsFileValue = (): Promise<string | undefined> => {
  if (process.env.NODE_EXTRA_CA_CERTS) {
    return fs.readFile(process.env.NODE_EXTRA_CA_CERTS, 'utf8').then((ca) => {
      return ca
    }).catch(() => {
      return undefined
    })
  }

  return Promise.resolve(undefined)
}

const getCaOptions = (): Promise<CaOptions> => {
  // Load the contents of process.env.npm_config_cafile and process.env.NODE_EXTRA_CA_CERTS
  // They will be cached so we don't have to actually read them on every call
  return Promise.all([getNpmConfigCAFileValue(), getNodeExtraCACertsFileValue()]).then(([npm_config_cafile, NODE_EXTRA_CA_CERTS]) => {
    // Merge the contents of ca with the npm config options. These options are meant to be replacements, but we want to keep the tls client certificate
    // config that our consumers provide
    if (npm_config_cafile) {
      return { ca: [npm_config_cafile] }
    }

    if (process.env.npm_config_ca) {
      return { ca: [process.env.npm_config_ca] }
    }

    // Merge the contents of ca with the NODE_EXTRA_CA_CERTS options. This option is additive to the tls root certificates
    if (NODE_EXTRA_CA_CERTS) {
      return { ca: tls.rootCertificates.concat(NODE_EXTRA_CA_CERTS) }
    }

    return {}
  })
}

export {
  getCaOptions,
}
