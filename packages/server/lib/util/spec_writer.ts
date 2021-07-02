import { fs } from './fs'
import { Visitor, builders as b, namedTypes as n, visit } from 'ast-types'
import * as recast from 'recast'
import { parse } from '@babel/parser'
import path from 'path'

const newFileTemplate = (file) => {
  return `// ${path.basename(file)} created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test
`
}

export interface Command {
  selector?: string
  name: string
  message?: string | string[]
  isAssertion?: boolean
}

export interface FileDetails {
  absoluteFile: string
  column: number
  line: number
}

const printSettings: recast.Options = {
  quote: 'single',
  wrapColumn: 360,
}

const generateCommentText = (comment) => ` ==== ${comment} ==== `

const createdComment = generateCommentText('Test Created with Cypress Studio')
const extendedStartComment = generateCommentText('Generated with Cypress Studio')
const extendedEndComment = generateCommentText('End Cypress Studio')

export const generateCypressCommand = (cmd: Command) => {
  const { selector, name, message, isAssertion } = cmd

  let messageExpression: n.ArrayExpression[] | n.StringLiteral[] | null = null

  if (isAssertion && Array.isArray(message)) {
    messageExpression = message.map(b.stringLiteral)
  } else if (Array.isArray(message)) {
    messageExpression = [b.arrayExpression(message.map(b.stringLiteral))]
  } else if (message) {
    messageExpression = [b.stringLiteral(message)]
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
        messageExpression || [],
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
        messageExpression || [],
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
  stmt.comments = [b.block(createdComment, true, false)]

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
  addCommentToBody(body, extendedStartComment)

  commands.forEach((command) => {
    body.push(generateCypressCommand(command))
  })

  addCommentToBody(body, extendedEndComment)

  return body
}

export const convertCommandsToText = (commands: Command[]) => {
  const program = b.program([])

  addCommandsToBody(program.body, commands)

  const { code } = recast.print(program, printSettings)

  return code
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

    const { code } = recast.print(ast, printSettings)

    return fs.writeFile(path, code)
  })
}

export const createFile = (path: string) => {
  return fs.writeFile(path, newFileTemplate(path))
}

export const countStudioUsage = (path: string) => {
  return fs.readFile(path)
  .then((specBuffer) => {
    const specContents = specBuffer.toString()
    const createdRegex = new RegExp(createdComment, 'g')
    const extendedRegex = new RegExp(extendedStartComment, 'g')

    // TODO: remove when Studio goes GA
    // earlier versions of studio used this comment to mark a created test
    // which was later changed to be consistent with other Studio comments
    const oldCreatedRegex = / === Test Created with Cypress Studio === /g
    const oldStudioCreated = (specContents.match(oldCreatedRegex) || []).length

    return {
      studioCreated: (specContents.match(createdRegex) || []).length + oldStudioCreated,
      studioExtended: (specContents.match(extendedRegex) || []).length,
    }
  })
}
