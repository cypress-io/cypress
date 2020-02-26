module.exports = (fileInfo, api) => {
  const j = api.jscodeshift

  const source = j(fileInfo.source)
  .find(j.TryStatement)
  .replaceWith((nodePath) => {
    const { node } = nodePath

    // Add trailing eslint-disable-line for empty catch block
    if (node.handler && node.handler.body.body.length === 0) {
      node.handler.body.comments = [
        {
          type: 'Line',
          value: ' eslint-disable-line no-empty',
          leading: false,
          trailing: true,
        },
      ]
    }

    return node
  })
  .toSource()

  // Generated source above creates {}// eslint-disable-line block.
  // So, add a space with replace
  return source.replace(/\{\}\/\/ eslint-disable-line/g, '{} // eslint-disable-line')
}
