const hide = (token) => {
  if (!token) {
    return
  }

  if (typeof token !== 'string') {
    // maybe somehow we passes key=true?
    // https://github.com/cypress-io/cypress/issues/14571
    return
  }

  return [
    token.slice(0, 5),
    token.slice(-5),
  ].join('...')
}

module.exports = {
  hide,
}
