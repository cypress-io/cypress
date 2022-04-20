import type { ParserOptions, PluginItem, Visitor } from '@babel/core'
import * as t from '@babel/types'

/**
 * Standardizes our approach to writing values into the existing
 * Cypress config file. Attempts to handle the pragmatic cases,
 * finding the
 *
 * @param toAdd k/v Object Property to append to the current object
 * @returns
 */
export function addToCypressConfigPlugin (toAdd: t.ObjectProperty): PluginItem {
  /**
   * Based on the import syntax, we look for the "defineConfig" identifier, and whether it
   * has been reassigned
   */
  const defineConfigIdentifiers: Array<string | [string, string]> = []
  /**
   * Checks whether we've seen the identifier
   */
  let seenConfigIdentifierCall = false

  // Returns the ObjectExpression associated with the defineConfig call,
  // so we can add in the "toAdd" object property
  function getDefineConfigExpression (node: t.CallExpression): t.ObjectExpression | undefined {
    for (const possibleIdentifier of defineConfigIdentifiers) {
      if (typeof possibleIdentifier === 'string') {
        if (t.isIdentifier(node.callee) && node.callee.name === possibleIdentifier && t.isObjectExpression(node.arguments[0])) {
          return node.arguments[0]
        }
      } else if (Array.isArray(possibleIdentifier)) {
        if (t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object) &&
          t.isIdentifier(node.callee.property) &&
          node.callee.object.name === possibleIdentifier[0] &&
          node.callee.property.name === possibleIdentifier[1] &&
          t.isObjectExpression(node.arguments[0])
        ) {
          return node.arguments[0]
        }
      }
    }

    return undefined
  }

  // Visits the program ahead-of-time, to know what transforms we need to do
  // on the source when we output the addition
  const nestedVisitor: Visitor = {
    ImportDeclaration (path) {
      // Skip "import type" for the purpose of finding the defineConfig identifier,
      // and skip if we see a non "cypress" import, since that's the only one we care about finding
      if (path.node.importKind === 'type' || path.node.source.value !== 'cypress') {
        return
      }

      for (const specifier of path.node.specifiers) {
        if (specifier.type === 'ImportNamespaceSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
          defineConfigIdentifiers.push([specifier.local.name, 'defineConfig'])
        } else {
          defineConfigIdentifiers.push(specifier.local.name)
        }
      }
    },
    VariableDeclaration (path) {
      // We only care about the top-level variable declarations for requires
      if (path.parent.type !== 'Program') {
        return
      }

      const cyImportDeclarations = path.node.declarations.filter((d) => {
        return (
          t.isCallExpression(d.init) &&
          t.isIdentifier(d.init.callee) &&
          d.init.callee.name === 'require' &&
          t.isStringLiteral(d.init.arguments[0]) &&
          d.init.arguments[0].value === 'cypress'
        )
      })

      for (const variableDeclaration of cyImportDeclarations) {
        if (t.isIdentifier(variableDeclaration.id)) {
          defineConfigIdentifiers.push([variableDeclaration.id.name, 'defineConfig'])
        } else if (t.isObjectPattern(variableDeclaration.id)) {
          for (const prop of variableDeclaration.id.properties) {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isIdentifier(prop.value)) {
              if (prop.key.name === 'defineConfig') {
                defineConfigIdentifiers.push(prop.value.name)
              }
            }
          }
        }
      }
    },
    CallExpression (path) {
      if (getDefineConfigExpression(path.node)) {
        seenConfigIdentifierCall = true
      }
    },
  }

  let didAdd = false

  return {
    name: 'addToCypressConfigPlugin',
    manipulateOptions (t, parserOpts: ParserOptions) {
      parserOpts.errorRecovery = true
      if (
        parserOpts.plugins.some(
          (p: any) => (Array.isArray(p) ? p[0] : p) === 'typescript',
        )
      ) {
        return
      }

      parserOpts.plugins.push('typescript')
    },
    visitor: {
      Program: {
        enter (path) {
          path.traverse(nestedVisitor)
        },
        exit () {
          if (!didAdd) {
            throw new Error('Unable to add the properties to the file')
          }
        },
      },
      CallExpression (path) {
        if (seenConfigIdentifierCall && !didAdd) {
          const defineConfigExpression = getDefineConfigExpression(path.node)

          if (defineConfigExpression) {
            defineConfigExpression.properties.push(toAdd)
            didAdd = true
          }
        }
      },
      ExportDefaultDeclaration (path) {
        // Exit if we've seen the defineConfig({ ... called elsewhere,
        // since this is where we'll be adding the object props
        if (seenConfigIdentifierCall || didAdd) {
          return
        }

        // export default {}
        if (t.isObjectExpression(path.node.declaration)) {
          path.node.declaration.properties.push(toAdd)
          didAdd = true
        } else if (t.isExpression(path.node.declaration)) {
          path.node.declaration = spreadResult(path.node.declaration, toAdd)
          didAdd = true
        }
      },
      AssignmentExpression (path) {
        // Exit if we've seen the defineConfig({ ... called elsewhere,
        // since this is where we'll be adding the object props
        if (seenConfigIdentifierCall || didAdd) {
          return
        }

        if (t.isMemberExpression(path.node.left) && isModuleExports(path.node.left)) {
          if (t.isObjectExpression(path.node.right)) {
            path.node.right.properties.push(toAdd)
            didAdd = true
          } else if (t.isExpression(path.node.right)) {
            path.node.right = spreadResult(path.node.right, toAdd)
            didAdd = true
          }
        }
      },
    },
  }
}

function spreadResult (expr: t.Expression, toAdd: t.ObjectProperty): t.ObjectExpression {
  return t.objectExpression([
    t.spreadElement(expr),
    toAdd,
  ])
}

function isModuleExports (node: t.MemberExpression) {
  return (
    t.isIdentifier(node.object) &&
    node.object.name === 'module' &&
    t.isIdentifier(node.property) &&
    node.property.name === 'exports'
  )
}
