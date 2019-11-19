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
      const { test, consequent } = c

      return {
        test: generateTest(j, test),
        content: generateContent(j, consequent),
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
    ifStatement = defaultCase.content
  }

  nonDefaultCases.reverse().forEach((c) => {
    ifStatement = j.ifStatement(
      c.test,
      c.content,
      ifStatement
    )
  })

  return ifStatement
}
