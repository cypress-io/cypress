import _ from 'lodash'
import type { $Cy } from '../cypress/cy'

import $errUtils from '../cypress/error_utils'

export const aliasRe = /^@.+/

export const aliasIndexRe = /\.(all|[\d]+)$/

const aliasDisplayRe = /^([@]+)/
const requestXhrRe = /\.request$/

const reserved = ['test', 'runnable', 'timeout', 'slow', 'skip', 'inspect']

export const aliasDisplayName = (name) => {
  return name.replace(aliasDisplayRe, '')
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (cy: $Cy) => ({
  addAlias (ctx, aliasObj) {
    const { alias } = aliasObj

    const aliases = cy.state('aliases') || {}

    aliases[alias] = aliasObj
    cy.state('aliases', aliases)

    ctx[alias] = cy.getSubjectFromChain(aliasObj.subjectChain)
  },

  getAlias (name: string, cmd?: string, log?: any) {
    const aliases = cy.state('aliases') || {}

    // bail if the name doesn't reference an alias
    if (!aliasRe.test(name)) {
      return
    }

    // slice off the '@'
    const alias = aliases[name.slice(1)]

    if (!alias) {
      this.aliasNotFoundFor(name, cmd, log)
    }

    return alias
  },

  // below are public because its expected other commands
  // know about them and are expected to call them

  getNextAlias () {
    const next = cy.state('current').get('next')

    if (next && (next.get('name') === 'as')) {
      return next.get('args')[0]
    }
  },

  validateAlias (alias: string) {
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

    if (_.isEmpty(alias)) {
      $errUtils.throwErrByPath('as.empty_string')
    }

    if (reserved.includes(alias)) {
      $errUtils.throwErrByPath('as.reserved_word', { args: { alias } })
    }

    return null
  },

  aliasNotFoundFor (name, cmd, log) {
    const availableAliases = cy.state('aliases')
      ? _.keys(cy.state('aliases'))
      : []

    let displayName

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

    $errUtils.throwErrByPath(errPath, {
      onFail: log,
      args: { cmd, displayName, availableAliases: availableAliases.join(', ') },
    })
  },

  getXhrTypeByAlias (alias) {
    if (requestXhrRe.test(alias)) {
      return 'request'
    }

    return 'response'
  },
})

export interface IAliases extends ReturnType<typeof create> {}
