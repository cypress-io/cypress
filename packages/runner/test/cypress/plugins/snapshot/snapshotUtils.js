const _ = require('lodash')
const chalk = require('chalk')

function printVar (variable) {
  switch (getType(variable)) {
    case 'Null':
      return variable
    case 'Undefined':
      return variable
    case 'Boolean':
      return variable
    case 'Number':
      return variable
    case 'Function':
      return `[Function${variable.name ? ` ${variable.name}` : ''}]`

    case 'Array':
    case 'Object':

      if (variable.toJSON) {
        return variable.toJSON()
      }

      return stringifyShort(variable)

    case 'String':
      return `${variable}`

    default: return `${variable}`
  }
}

function getType (obj) {
  return Object.prototype.toString.call(obj).split('[object ').join('').slice(0, -1)
}

const stringifyShort = (obj) => {
  const constructorName = _.get(obj, 'constructor.name')

  if (constructorName && !_.includes(['Object', 'Array'], constructorName)) {
    return `{${constructorName}}`
  }

  if (_.isArray(obj)) {
    return `[Array ${obj.length}]`
  }

  if (_.isObject(obj)) {
    return `{Object ${Object.keys(obj).length}}`
  }

  return obj
}

function isObject (obj) {
  return typeof obj === 'object' && obj && getType(obj) !== 'RegExp'
}

function addPluginButton ($, name, faClass, { render, click }) {
  $(`#${name}`, window.top.document).remove()

  const btn = $(`<span id="${name}"><button><i class="fa ${faClass}"></i></button></span>`, window.top.document)
  const container = $(
    '.toggle-auto-scrolling.auto-scrolling-enabled',
    window.top.document,
  ).closest('.controls')

  container.prepend(btn)

  btn.on('click', () => {
    click.apply(btn[0])
    render.apply(btn[0])
  })

  render.apply(btn[0])

  return btn
}

const typeColors = {
  modified: chalk.yellow,
  added: chalk.green,
  removed: chalk.red,
  normal: chalk.gray,
  failed: chalk.redBright,
}

const fmtOpts = {
  indent: '  ',
  newLineChar: '\n',
}

const fmt = {
  wrap: function wrap (type, text) {
    if (this.Cypress) {
      text = `**${text}**`
    }

    return typeColors[type](text)
  },

  wrapObjectLike (exp, act, subOutput) {
    let renderBracket = false

    if (_.isArray(act) && _.isArray(exp)) {
      renderBracket = true
    }

    const _O = renderBracket ? '[' : '{'
    const _C = renderBracket ? ']' : '}'

    return fmt.wrap('normal', `${_O}${fmtOpts.newLineChar}${subOutput}${_C}`)
  },

  indentSubItem (text) {
    return text.split(fmtOpts.newLineChar).map(function (line, index) {
      if (index === 0) {
        return line
      }

      return fmtOpts.indent + line
    }).join(fmtOpts.newLineChar)
  },

  keyChanged (key, text) {
    return `${fmtOpts.indent + key}: ${fmt.indentSubItem(text)}${fmtOpts.newLineChar}`
  },

  keyRemoved (key, variable) {
    return fmt.wrap('removed', `- ${key}: ${printVar(variable)}`) + fmtOpts.newLineChar
  },

  keyAdded (key, variable) {
    return fmt.wrap('added', `+ ${key}: ${printVar(variable)}`) + fmtOpts.newLineChar
  },
}

module.exports = {
  printVar,
  stringifyShort,
  isObject,
  addPluginButton,
  fmt,
  fmtOpts,
  typeColors,
}
