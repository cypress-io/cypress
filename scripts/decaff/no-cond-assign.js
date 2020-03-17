module.exports = (fileInfo, api) => {
  const j = api.jscodeshift

  return j(fileInfo.source)
  .find(j.IfStatement, {
    test: {
      type: 'AssignmentExpression',
    },
  })
  .replaceWith((nodePath) => {
    const { node } = nodePath

    const assign = j.expressionStatement(node.test)

    assign.comments = node.comments

    const ifStatement = j.ifStatement(
      node.test.left,
      node.consequent,
      node.alternate,
    )

    return [
      assign,
      ifStatement,
    ]
  })
  .toSource()
}
