module.exports = (fileInfo, api) => {
  const j = api.jscodeshift

  return j(fileInfo.source)
  .find(j.VariableDeclaration, {
    declarations: [{
      type: 'VariableDeclarator',
      init: {
        type: 'ArrowFunctionExpression',
        body: {
          type: 'BlockStatement',
        },
      },
    }],
  })
  .replaceWith((nodePath) => {
    const { node } = nodePath
    const comments = node.declarations[0].init.body.comments

    if (comments && comments.length > 0) {
      node.comments = [...node.comments, ...comments]
      node.declarations[0].init.body.comments = null
    }

    return node
  })
  .toSource()
}
