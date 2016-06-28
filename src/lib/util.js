const INDENT_BASE = 5
const INDENT_AMOUNT = 15

function indent (level) {
  return INDENT_BASE + level * INDENT_AMOUNT
}

export {
  indent,
}
