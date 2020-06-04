const _ = require('lodash')
let fs = require('fs-extra')
let glob = require('glob')
const Promise = require('bluebird')
const inquirer = require('inquirer')
const path = require('path')

glob = Promise.promisify(glob)

const prompt = (questions) => {
  return Promise.resolve(inquirer.prompt(questions))
}

fs = Promise.promisifyAll(fs)

const getZipFile = () => {
  return [{
    name: 'zipFile',
    type: 'string',
    default: 'cypress.zip',
    message: 'Which zip file should we upload?',
  }]
}

const getPlatformQuestion = () => {
  return [{
    name: 'platform',
    type: 'list',
    message: 'Which OS should we deploy?',
    choices: [{
      name: 'Mac',
      value: 'darwin',
    }, {
      name: 'Linux',
      value: 'linux',
    }, {
      name: 'Windows',
      value: 'win32',
    }],
  }]
}

const getQuestions = (version) => {
  return [{
    name: 'publish',
    type: 'list',
    message: `Publish a new version? (currently: ${version})`,
    choices: [{
      name: 'Yes: set a new version and deploy new version.',
      value: true,
    }, {
      name: 'No:  just override the current deploy’ed version.',
      value: false,
    }],
  }, {
    name: 'version',
    type: 'input',
    message: `Bump version to...? (currently: ${version})`,
    default () {
      const a = version.split('.')
      let v = a[a.length - 1]

      v = Number(v) + 1
      a.splice(a.length - 1, 1, v)

      return a.join('.')
    },
    when (answers) {
      return answers.publish
    },
  }]
}

const getReleases = (releases) => {
  return [{
    name: 'release',
    type: 'list',
    message: 'Release which version?',
    choices: _.map(releases, (r) => {
      return {
        name: r,
        value: r,
      }
    }),
  }]
}

const getNextVersion = function ({ version } = {}) {
  if (!version) {
    ({
      version,
    } = require(path.join(__dirname, '..', '..', 'package.json')))
  }

  const message = `Bump next version to...? (currently: ${version})`
  const defaultVersion = function () {
    const a = version.split('.')
    let v = a[a.length - 1]

    v = Number(v) + 1
    a.splice(a.length - 1, 1, v)

    return a.join('.')
  }

  return [{
    name: 'nextVersion',
    type: 'input',
    message,
    default: defaultVersion,
  }]
}

const getVersions = (releases) => {
  return [{
    name: 'version',
    type: 'list',
    message: 'Bump to which version?',
    choices: _.map(releases, (r) => {
      return {
        name: r,
        value: r,
      }
    }),
  }]
}

const getBumpTasks = () => {
  return [{
    name: 'task',
    type: 'list',
    message: 'Which bump task?',
    choices: [{
      name: 'Bump Cypress Binary Version for all CI providers',
      value: 'version',
    }, {
      name: 'Run All Projects for all CI providers',
      value: 'run',
    }],
  }]
}

const getCommitVersion = (version) => {
  return [{
    name: 'commit',
    type: 'list',
    message: `Commit this new version to git? (currently: ${version})`,
    choices: [{
      name: 'Yes: commit and push this new release version.',
      value: true,
    }, {
      name: 'No:  do not commit.',
      value: false,
    }],
  }]
}

const deployNewVersion = () => {
  return fs.readJsonAsync('./package.json')
  .then((json) => {
    return prompt(getQuestions(json.version))
    .then((answers) => {
    // set the new version if we're publishing!
    // update our own local package.json as well
      if (answers.publish) {
      // @updateLocalPackageJson(answers.version, json).then ->
        return answers.version
      }

      return json.version
    })
  })
}

const whichZipFile = () => {
  return prompt(getZipFile())
  .get('zipFile')
}

const whichVersion = (distDir) => {
  return glob('*/package.json', { cwd: distDir, realpath: true })
  .map((pkg) => {
    return fs.readJsonAsync(pkg)
    .get('version')
  }).then((versions) => {
    versions = _.uniq(versions)

    return prompt(getVersions(versions))
    .get('version')
  })
}

const whichRelease = (distDir) => {
  return glob('*/package.json', { cwd: distDir, realpath: true })
  .map((pkg) => {
    return fs.readJsonAsync(pkg)
    .get('version')
  }).then((versions) => {
    versions = _.uniq(versions)

    return prompt(getReleases(versions))
    .get('release')
  })
}

const whichPlatform = () => {
  return prompt(getPlatformQuestion())
  .get('platform')
}

const whichBumpTask = () => {
  return prompt(getBumpTasks())
  .get('task')
}

const nextVersion = (version) => {
  return prompt(getNextVersion(version))
  .get('nextVersion')
}

const toCommit = ({ version }) => {
  return prompt(getCommitVersion(version))
  .get('commit')
}

module.exports = {
  toCommit,
  getZipFile,
  getPlatformQuestion,
  getQuestions,
  getReleases,
  getVersions,
  getBumpTasks,
  deployNewVersion,
  nextVersion,
  whichZipFile,
  whichVersion,
  whichRelease,
  whichPlatform,
  whichBumpTask,

}
