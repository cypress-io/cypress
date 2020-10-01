export const add = (a, b) => {
  return a + b
}

export const sub = (a, b) => {
  return a - b
}

export const div = (a, b) => {
  if (b === 0) {
    throw new Error(`Cannot divide ${a} by zero`)
  }

  return a / b
}
