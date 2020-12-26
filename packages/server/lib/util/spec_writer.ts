import fs from './fs'
import { Visitor, builders as b, namedTypes as n, visit } from 'ast-types'
import * as recast from 'recast'
import { parse } from '@babel/parser'

interface Command {
  selector: string
  name: string
  message?: string
}

export const generateCypressCommand = (cmd: Command) => {
  const { selector, name, message } = cmd

  return b.expressionStatement(
    b.callExpression(
      b.memberExpression(
        b.callExpression(
          b.memberExpression(
            b.identifier('cy'),
            b.identifier('get'),
            false,
          ),
          [b.stringLiteral(selector)],
        ),
        b.identifier(name),
      ),
      message ? [b.stringLiteral(message)] : [],
    ),
  )
}

export const addCommentToBody = (body: Array<{}>, comment: string) => {
  const block = b.block(comment, false, true)
  const stmt = b.emptyStatement()

  stmt.comments = [block]

  body.push(stmt)

  return body
}

export const addCommandsToBody = (body: Array<{}>, commands: Command[]) => {
  addCommentToBody(body, ' ==== Generated with Cypress Studio ==== ')

  commands.forEach((command) => {
    body.push(generateCypressCommand(command))
  })

  addCommentToBody(body, ' ==== End Cypress Studio ==== ')

  return body
}

export const appendStudioCommandsToTest = (fileDetails, commands: Command[]) => {
  const { absoluteFile, line, column } = fileDetails

  const astRules: Visitor<{}> = {
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
          const fn = node.arguments[1] as n.FunctionExpression

          if (!fn) {
            return false
          }

          addCommandsToBody(fn.body.body, commands)

          return false
        }
      }

      return this.traverse(path)
    },
  }

  return rewriteSpec(absoluteFile, astRules)
}

export const rewriteSpec = (path: string, astRules: Visitor<{}>) => {
  return fs.readFile(path)
  .then((contents) => {
    const ast = recast.parse(contents, {
      wrapColumn: 180,
      parser: {
        parse (source) {
          return parse(source, {
            // @ts-ignore - this option works but wasn't added to the type defs
            errorRecovery: true,
            sourceType: 'unambiguous',
            plugins: [
              'typescript',
            ],
          })
        },
      },
    })

    visit(ast, astRules)

    const { code } = recast.print(ast)

    return fs.writeFile(path, code)
  })
}
