const hide = (token) => {
  if (!token) {
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
