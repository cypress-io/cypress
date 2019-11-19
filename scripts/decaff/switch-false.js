module.exports = (fileInfo, api) => {
  const j = api.jscodeshift

  return j(fileInfo.source)
  .find(j.SwitchStatement, {
    discriminant: {
      type: 'Literal',
      value: false,
    },
  })
  .replaceWith((nodePath) => {
    const { node } = nodePath

    const cases = node.cases.map((c) => {
      const { test, consequent, comments } = c

      return {
        test: generateTest(j, test),
        content: generateContent(j, consequent),
        comments,
      }
    })

    const ifStatement = generateIfStatement(j, cases)

    ifStatement.comments = node.comments

    return ifStatement
  })
  .toSource()
}

function generateTest (j, test) {
  if (test) {
    if (test.type === 'UnaryExpression') {
      return test.argument
    }

    return j.unaryExpression('!', test)
  }

  return null
}

function generateContent (j, consequent) {
  return j.blockStatement(consequent.filter((c) => c.type !== 'BreakStatement'))
}

function generateIfStatement (j, cases) {
  const nonDefaultCases = cases.filter((c) => c.test !== null)
  const defaultCase = cases.filter((c) => c.test === null)[0]

  let ifStatement = null

  if (defaultCase) {
    const content = addComment(defaultCase.content, defaultCase.comments)

    ifStatement = content
  }

  nonDefaultCases.reverse().forEach((c) => {
    const content = addComment(c.content, c.comments)

    ifStatement = j.ifStatement(
      c.test,
      content,
      ifStatement
    )
  })

  return ifStatement
}

function addComment (content, comments) {
  if (content.body.length > 0) {
    content.body[0].comments = [...(comments || []), ...(content.comments || [])]
  } else {
    content.comments = (comments || []).map((co) => {
      return {
        ...co,
        leading: false,
        trailing: false,
      }
    })
  }

  return content
}
