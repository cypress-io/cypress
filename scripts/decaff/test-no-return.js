module.exports = (fileInfo, api) => {
  const funcs = [
    { name: 'beforeEach', index: 0 },
    { name: 'afterEach', index: 0 },
    { name: 'it', index: 1 },
  ]

  const j = api.jscodeshift

  const removeReturn = (src, name, index) => {
    return j(src)
    .find(j.ExpressionStatement, {
      expression: {
        callee: {
          type: 'Identifier',
          name,
        },
      },
    })
    .replaceWith(({ node }) => {
      let block = node.expression.arguments[index].body

      if (block.body && block.body.length > 0) {
        block.body = block.body.map((s) => {
          if (s.type === 'ReturnStatement') {
            const stat = j.expressionStatement(s.argument)

            if (s.comments) {
              stat.comments = s.comments
            }

            return stat
          }

          return s
        })
      }

      return node
    })
    .toSource()
  }

  let src = fileInfo.source

  funcs.forEach(({ name, index }) => {
    src = removeReturn(src, name, index)
  })

  return src
}
