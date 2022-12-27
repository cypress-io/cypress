import { fs } from './fs'
import { ASTNode, Visitor, builders as b, namedTypes as n, visit } from 'ast-types'
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
  absoluteFile?: string
  column: number
  line: number
}

export interface SaveDetails {
  fileDetails?: FileDetails
  absoluteFile: string
  runnableTitle: string
  commands: Command[]
  testName?: string
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
    // generates a statement in the form of cy.get(selector).name(message)
    // ex. cy.get('.btn').click() or cy.get('.input').type('words')
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
    // generates a statement in the form of cy.name(message)
    // ex. cy.visit('https://example.cypress.io')
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
  // creates an `it` statement with name and given body
  // it('name', function () { body })
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

const getIdentifier = (node: n.CallExpression): n.Identifier | undefined => {
  const { callee } = node

  if (callee.type === 'Identifier') {
    return callee
  }

  // .only forms a member expression
  // with the first part (`object`) being the identifier of interest
  if (callee.type === 'MemberExpression') {
    return callee.object as n.Identifier
  }

  return
}

const getFunctionFromExpression = (node: n.CallExpression): n.FunctionExpression | undefined => {
  const arg1 = node.arguments[1]

  // if the second argument is an object we have a test/suite configuration
  if (arg1.type === 'ObjectExpression') {
    return node.arguments[2] as n.FunctionExpression
  }

  return arg1 as n.FunctionExpression
}

// try to find the runnable based off line and column number
const generateFileDetailsAstRules = (fileDetails: { line: number, column: number }, fnNames: string[], cb: (fn: n.FunctionExpression) => any): Visitor<{}> => {
  const { line, column } = fileDetails

  return {
    visitCallExpression (path) {
      const { node } = path

      const identifier = getIdentifier(node)

      if (identifier && identifier.loc) {
        const columnStart = identifier.loc.start.column + 1
        const columnEnd = identifier.loc.end.column + 2

        if (fnNames.includes(identifier.name) && identifier.loc.start.line === line && columnStart <= column && column <= columnEnd) {
          const fn = getFunctionFromExpression(node)

          if (!fn) {
            return this.abort()
          }

          cb(fn)

          return this.abort()
        }
      }

      return this.traverse(path)
    },
  }
}

// try to find the runnable based off title
const generateTestPathAstRules = (runnableTitle: string, fnNames: string[], cb: (fn?: n.FunctionExpression) => any): Visitor<{}> => {
  return {
    visitCallExpression (path) {
      const { node } = path

      const identifier = getIdentifier(node)

      if (identifier && fnNames.includes(identifier.name)) {
        const arg0 = node.arguments[0] as n.StringLiteral

        if (arg0.value === runnableTitle) {
          const fn = getFunctionFromExpression(node)

          cb(fn)

          return false
        }
      }

      return this.traverse(path)
    },
  }
}

const createTest = ({ body }: n.Program | n.BlockStatement, commands: Command[], testName: string) => {
  const testBody = b.blockStatement([])

  addCommandsToBody(testBody.body, commands)

  const test = generateTest(testName, testBody)

  body.push(test)

  return test
}

const updateRunnableExpression = async ({ fileDetails, absoluteFile, runnableTitle }: SaveDetails, fnNames: string[], cb: (fn: n.FunctionExpression) => any): Promise<Boolean> => {
  // if we have file details we first try to find the runnable using line and column number
  if (fileDetails && fileDetails.absoluteFile) {
    const fileDetailsAst = await getAst(fileDetails.absoluteFile)
    let fileDetailsSuccess = false

    const fileDetailsAstRules = generateFileDetailsAstRules(fileDetails, fnNames, (fn) => {
      cb(fn)

      fileDetailsSuccess = true
    })

    visit(fileDetailsAst, fileDetailsAstRules)

    if (fileDetailsSuccess) {
      return writeAst(fileDetails.absoluteFile, fileDetailsAst)
      .then(() => true)
    }
  }

  // if there are no file details or the line/column are incorrect
  // we try to then match by runnable title
  const runnableTitleAst = await getAst(absoluteFile)
  let runnableTitleSuccess = false
  let runnableTitleFound = false

  const runnableTitleAstRules = generateTestPathAstRules(runnableTitle, fnNames, (fn) => {
    // if there are two runnables with the same title we can't tell which is the target
    // so we don't save anything
    if (runnableTitleFound) {
      runnableTitleSuccess = false
    } else {
      if (fn) {
        cb(fn)
        runnableTitleSuccess = true
      }

      runnableTitleFound = true
    }
  })

  visit(runnableTitleAst, runnableTitleAstRules)

  if (runnableTitleSuccess) {
    return writeAst(absoluteFile, runnableTitleAst)
    .then(() => true)
  }

  return Promise.resolve(false)
}

export const appendCommandsToTest = async (saveDetails: SaveDetails) => {
  const { commands } = saveDetails

  return updateRunnableExpression(saveDetails, ['it', 'specify'], (fn) => {
    addCommandsToBody(fn.body.body, commands)
  })
}

export const createNewTestInSuite = (saveDetails: SaveDetails) => {
  const { commands, testName } = saveDetails

  return updateRunnableExpression(saveDetails, ['describe', 'context'], (fn) => {
    createTest(fn.body, commands, testName!)
  })
}

export const createNewTestInFile = (absoluteFile: string, commands: Command[], testName: string): Promise<Boolean> => {
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

  return getAst(absoluteFile)
  .then((ast) => {
    visit(ast, astRules)

    if (success) {
      return writeAst(absoluteFile, ast)
      .then(() => true)
    }

    return Promise.resolve(false)
  })
}

const getAst = (path: string): Promise<ASTNode> => {
  return fs.readFile(path)
  .then((contents) => {
    return recast.parse(contents.toString(), {
      parser: {
        parse (source) {
          // use babel parser for ts support and more
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
  })
}

const writeAst = (path: string, ast: ASTNode) => {
  const { code } = recast.print(ast, printSettings)

  return fs.writeFile(path, code)
}

export const createFile = (path: string) => {
  return fs.writeFile(path, newFileTemplate(path))
}

// currently un-used post 10.x release
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
