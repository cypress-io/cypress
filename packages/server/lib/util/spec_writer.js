const fs = require('./fs')
const { builders, visit } = require('ast-types')
const recast = require('recast')

const studioComment = builders.block(' ==== Generated with Cypress Studio ==== ', true, false)

const generateCypressCommand = (cmd, first) => {
  const { selector, command, value } = cmd

  const expressionStatement = builders.expressionStatement(
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

  if (first) {
    expressionStatement.comments = [studioComment]
  }

  return expressionStatement
}

module.exports = {
  appendStudioCommandsToTest: (fileDetails, commandLog) => {
    const { absoluteFile, line, column } = fileDetails

    const astRules = {
      visitCallExpression (path) {
        const { node } = path
        const { callee } = node

        let identifier

        if (callee.type === 'Identifier') {
          identifier = callee
        } else if (callee.type === 'MemberExpression') {
          identifier = callee.object
        }

        if (identifier) {
          const columnStart = identifier.loc.start.column + 1
          const columnEnd = identifier.loc.end.column + 2

          if (identifier.name === 'it' && identifier.loc.start.line === line && columnStart <= column && column <= columnEnd) {
            const fn = node.arguments[1]

            if (!fn) {
              return false
            }

            const body = fn.body.body

            commandLog.forEach((command, index) => {
              body.push(generateCypressCommand(command, index === 0))
            })

            return false
          }
        }

        this.traverse(path)
      },
    }

    const path = absoluteFile

    return fs.readFile(path)
    .then((contents) => {
      const ast = recast.parse(contents, {
        parser: require('@babel/parser'),
        wrapColumn: 180,
      })

      visit(ast, astRules)

      const { code } = recast.print(ast)

      return fs.writeFile(path, code)
    })
  },
}
