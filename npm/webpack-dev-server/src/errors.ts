export interface MissingDependency {
  prettyName: string
  packageName: string
}

const peerDeps: MissingDependency[] = [
  {
    prettyName: 'Webpack Dev Server',
    packageName: 'webpack-dev-server',
  },
  {
    prettyName: 'Html Webpack Plugin',
    packageName: 'html-webpack-plugin',
  },
  {
    prettyName: 'Webpack',
    packageName: 'webpack',
  },
]

const makePrettyLibs = (libs) => {
  return libs.reduce((acc, curr, idx) => {
    acc.prettyNames.push(curr.prettyName)
    acc.packageNames.push(curr.packageName)

    if (idx >= libs.length) return acc

    return {
      prettyNames: acc.prettyNames.join(', '),
      packageNames: acc.packageNames.join(' '),
    }
  }, { prettyNames: [], packageNames: [] })
}

export class MissingPeerDependency extends Error {
  private libs: { prettyNames: string[], packageNames: string[] }

  constructor (message,
    libs: MissingDependency[]) {
    const prettyLibs = makePrettyLibs(libs)

    super(`${message} ${prettyLibs.prettyNames}`)
    this.name = 'PeerDependencyMissing'
    this.libs = prettyLibs

    Object.setPrototypeOf(this, MissingPeerDependency.prototype)
  }

  get prettyMessage () {
    return `❌ Missing ${this.libs.prettyNames}. Please install them with npm or yarn.

    npm i ${this.libs.packageNames} -D
    yarn add ${this.libs.packageNames} --dev

    Updating webpack config is unnecessary
`
  }
}

export function validatePeerDependencies () {
  const missingPeerDeps = peerDeps.filter((peerDep) => {
    try {
      require(peerDep.packageName)
    } catch (err) {
      return true
    }

    return false
  })

  if (missingPeerDeps.length) {
    const error = new MissingPeerDependency(`@cypress/webpack-dev-server is missing peer dependencies`, missingPeerDeps)

    console.error(error.prettyMessage) // eslint-disable-line

    throw error
  }

  return true
}
