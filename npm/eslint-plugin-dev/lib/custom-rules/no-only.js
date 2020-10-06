let astUtils

try {
  astUtils = require('eslint/lib/util/ast-utils')
} catch (e) {
  astUtils = require('eslint/lib/shared/ast-utils')
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'stop .only\'s in spec files',
      category: 'Spec Issues',
    },
    messages: {
      noOnly: 'Found only: `{{callee}}`.',
    },

    // uncomment to enable autoFix
    // fixable: 'code',
  },

  create (context) {
    const sourceCode = context.getSourceCode()

    function getPropertyText (node) {
      const lines = sourceCode.getText(node).split(astUtils.LINEBREAK_MATCHER)

      return lines[0]
    }

    return {
      'CallExpression:exit' (node) {
        const callee = node.callee

        if (node.type === 'CallExpression' && callee.type === 'MemberExpression' && callee.property.name === 'only') {
          if (['it', 'describe', 'context'].includes(callee.object.name)) {
            context.report({
              node: callee.property,
              loc: callee.property.loc.start,
              messageId: 'noOnly',
              data: {
                callee: getPropertyText(callee.parent),
              },
              // uncomment to enable autoFix
              // fix(fixer) {
              //   return fixer.replaceTextRange([callee.property.start - 1, callee.property.end], '')
              // }
            })
          }
        }
      },
    }
  },
}
