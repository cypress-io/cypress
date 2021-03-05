import { fs } from './fs'
import { Visitor, builders as b, namedTypes as n, visit } from 'ast-types'
import * as recast from 'recast'
import { parse } from '@babel/parser'

export interface Command {
  selector?: string
  name: string
  message?: string | string[]
}

export interface FileDetails {
  absoluteFile: string
  column: number
  line: number
}

export const generateCypressCommand = (cmd: Command) => {
  const { selector, name, message } = cmd

  let messageExpression: n.ArrayExpression | n.StringLiteral | null = null

  if (Array.isArray(message)) {
    messageExpression = b.arrayExpression(message.map((e) => b.stringLiteral(e)))
  } else if (message) {
    messageExpression = b.stringLiteral(message)
  }

  let stmt

  if (selector) {
    stmt = b.expressionStatement(
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
        messageExpression ? [messageExpression] : [],
      ),
    )
  } else {
    stmt = b.expressionStatement(
      b.callExpression(
        b.memberExpression(
          b.identifier('cy'),
          b.identifier(name),
          false,
        ),
        messageExpression ? [messageExpression] : [],
      ),
    )
  }

  // for some reason in certain files no comments will show up at all without this
  // even if they're attached to different commands
  stmt.comments = []

  return stmt
}

export const generateTest = (name: string, body: n.BlockStatement) => {
  const stmt = b.expressionStatement(
    b.callExpression(
      b.identifier('it'),
      [
        b.stringLiteral(name),
        b.functionExpression(
          null,
          [],
          body,
        ),
      ],
    ),
  )

  // adding the comment like this also adds a newline before the comment
  stmt.comments = [b.block(' === Test Created with Cypress Studio === ', true, false)]

  return stmt
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

export const generateAstRules = (fileDetails: { line: number, column: number }, fnNames: string[], cb: (fn: n.FunctionExpression) => any): Visitor<{}> => {
  const { line, column } = fileDetails

  return {
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

        if (fnNames.includes(identifier.name) && identifier.loc.start.line === line && columnStart <= column && column <= columnEnd) {
          const arg1 = node.arguments[1]

          const fn = (arg1.type === 'ObjectExpression' ? node.arguments[2] : arg1) as n.FunctionExpression

          if (!fn) {
            return false
          }

          cb(fn)

          return false
        }
      }

      return this.traverse(path)
    },
  }
}

export const createTest = ({ body }: n.Program | n.BlockStatement, commands: Command[], testName: string) => {
  const testBody = b.blockStatement([])

  addCommandsToBody(testBody.body, commands)

  const test = generateTest(testName, testBody)

  body.push(test)

  return test
}

export const appendCommandsToTest = (fileDetails: FileDetails, commands: Command[]) => {
  const { absoluteFile } = fileDetails

  let success = false

  const astRules = generateAstRules(fileDetails, ['it', 'specify'], (fn: n.FunctionExpression) => {
    addCommandsToBody(fn.body.body, commands)

    success = true
  })

  return rewriteSpec(absoluteFile, astRules)
  .then(() => success)
}

export const createNewTestInSuite = (fileDetails: FileDetails, commands: Command[], testName: string) => {
  const { absoluteFile } = fileDetails

  let success = false

  const astRules = generateAstRules(fileDetails, ['context', 'describe'], (fn: n.FunctionExpression) => {
    createTest(fn.body, commands, testName)

    success = true
  })

  return rewriteSpec(absoluteFile, astRules)
  .then(() => success)
}

export const createNewTestInFile = ({ absoluteFile }: {absoluteFile: string}, commands: Command[], testName: string) => {
  let success = false

  const astRules = {
    visitProgram (path) {
      const { node } = path
      const { innerComments } = node

      // needed to preserve any comments in an empty file
      if (innerComments) {
        innerComments.forEach((comment) => comment.leading = true)
      }

      createTest(node, commands, testName)

      success = true

      return false
    },
  }

  return rewriteSpec(absoluteFile, astRules)
  .then(() => success)
}

export const rewriteSpec = (path: string, astRules: Visitor<{}>) => {
  return fs.readFile(path)
  .then((contents) => {
    const ast = recast.parse(contents.toString(), {
      parser: {
        parse (source) {
          return parse(source, {
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

    const { code } = recast.print(ast, {
      quote: 'single',
      wrapColumn: 360,
    })

    return fs.writeFile(path, code)
  })
}
