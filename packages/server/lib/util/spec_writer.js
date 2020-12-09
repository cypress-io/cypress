const fs = require('./fs')
const { builders, visit } = require('ast-types')
const recast = require('recast')

const generateCypressCommand = (cmd) => {
  const { selector, command, value } = cmd

  return builders.expressionStatement(
    builders.callExpression(
      builders.memberExpression(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier('cy'),
            builders.identifier('get'),
            false,
          ),
          [builders.stringLiteral(selector)],
        ),
        builders.identifier(command),
      ),
      value ? [builders.stringLiteral(value)] : [],
    ),
  )
}

module.exports = {
  appendStudioCommandsToTest: (fileDetails, commandLog) => {
    const astRules = {
      visitCallExpression (path) {
        const { node } = path
        const { callee } = node

        if (callee.name === 'it' && callee.loc.start.line === fileDetails.line) {
          const fn = node.arguments[1]

          if (!fn) {
            return false
          }

          const body = fn.body.body

          commandLog.forEach((command) => {
            body.push(generateCypressCommand(command))
          })

          return false
        }

        this.traverse(path)
      },
    }

    const path = fileDetails.absoluteFile

    return fs.readFile(path)
    .then((contents) => {
      const ast = recast.parse(contents, {
        parser: require('@babel/parser'),
      })

      visit(ast, astRules)

      const { code } = recast.print(ast)

      return fs.writeFile(path, code)
    })
  },
}
