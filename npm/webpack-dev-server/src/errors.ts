import packageJson from '../package.json'

export class MissingPeerDependency extends Error {
  constructor (
    message,
    public libs: string[],
  ) {
    super(`${message} ${libs.join(', ')}`)
    this.name = 'PeerDependencyMissing'

    Object.setPrototypeOf(this, MissingPeerDependency.prototype)
  }

  get prettyMessage () {
    const packagesToInstall = this.libs.join(', ')

    return `❌ Missing ${packagesToInstall}. Please install them with npm or yarn.

    npm i ${packagesToInstall} -D
    yarn add ${packagesToInstall} --dev

    P.S. Updating webpack config is unnecessary
`
  }
}

export function validatePeerDependencies () {
  const missingPeerDeps = Object.keys(packageJson.peerDependencies).filter((peerDep) => {
    try {
      require(peerDep)
    } catch (err) {
      return true
    }

    return false
  })

  if (missingPeerDeps.length) {
    const error = new MissingPeerDependency(`@cypress/webpack-dev-server is missing peer dependencies:`, missingPeerDeps)

    console.error(error.prettyMessage) // eslint-disable-line

    throw error
  }

  return true
}
