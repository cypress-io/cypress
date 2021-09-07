const _ = require('lodash')

const $errUtils = require('../cypress/error_utils')

const aliasRe = /^@.+/
const aliasDisplayRe = /^([@]+)/
const requestXhrRe = /\.request$/

const reserved = ['test', 'runnable', 'timeout', 'slow', 'skip', 'inspect']

const aliasDisplayName = (name) => {
  return name.replace(aliasDisplayRe, '')
}

const getXhrTypeByAlias = (alias) => {
  if (requestXhrRe.test(alias)) {
    return 'request'
  }

  return 'response'
}

const validateAlias = (alias) => {
  if (!_.isString(alias)) {
    $errUtils.throwErrByPath('as.invalid_type')
  }

  if (aliasDisplayRe.test(alias)) {
    $errUtils.throwErrByPath('as.invalid_first_token', {
      args: {
        alias,
        suggestedName: alias.replace(aliasDisplayRe, ''),
      },
    })
  }

  if (_.isBlank(alias)) {
    $errUtils.throwErrByPath('as.empty_string')
  }

  if (reserved.includes(alias)) {
    return $errUtils.throwErrByPath('as.reserved_word', { args: { alias } })
  }
}

const create = (cy) => {
  const addAlias = (ctx, aliasObj) => {
    const { alias, subject } = aliasObj

    const aliases = cy.state('aliases') || {}

    aliases[alias] = aliasObj
    cy.state('aliases', aliases)

    const remoteSubject = cy.getRemotejQueryInstance(subject)

    ctx[alias] = remoteSubject ?? subject
  }

  const getNextAlias = () => {
    const next = cy.state('current').get('next')

    if (next && (next.get('name') === 'as')) {
      return next.get('args')[0]
    }
  }

  const getAlias = (name, cmd, log) => {
    const aliases = cy.state('aliases') || {}

    // bail if the name doesnt reference an alias
    if (!aliasRe.test(name)) {
      return
    }

    const alias = aliases[name.slice(1)]

    // slice off the '@'
    if (!alias) {
      aliasNotFoundFor(name, cmd, log)
    }

    return alias
  }

  const getAvailableAliases = () => {
    const aliases = cy.state('aliases')

    if (!aliases) {
      return []
    }

    return _.keys(aliases)
  }

  const aliasNotFoundFor = (name, cmd, log) => {
    let displayName
    const availableAliases = getAvailableAliases()

    // throw a very specific error if our alias isnt in the right
    // format, but its word is found in the availableAliases
    if (!aliasRe.test(name) && availableAliases.includes(name)) {
      displayName = aliasDisplayName(name)
      $errUtils.throwErrByPath('alias.invalid', {
        onFail: log,
        args: { name, displayName },
      })
    }

    cmd = cmd ?? ((log && log.get('name')) || cy.state('current').get('name'))
    displayName = aliasDisplayName(name)

    const errPath = availableAliases.length
      ? 'alias.not_registered_with_available'
      : 'alias.not_registered_without_available'

    return $errUtils.throwErrByPath(errPath, {
      onFail: log,
      args: { cmd, displayName, availableAliases: availableAliases.join(', ') },
    })
  }

  return {
    getAlias,

    addAlias,

    // these are public because its expected other commands
    // know about them and are expected to call them
    getNextAlias,

    validateAlias,

    aliasNotFoundFor,

    getXhrTypeByAlias,

    getAvailableAliases,
  }
}

module.exports = {
  create,
}
