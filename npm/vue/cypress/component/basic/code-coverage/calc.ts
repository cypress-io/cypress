export const add = (a: number, b: number) => {
  return a + b
}

export const sub = (a: number, b: number) => {
  return a - b
}

export const div = (a: number, b: number) => {
  if (b === 0) {
    throw new Error(`Cannot divide ${a} by zero`)
  }

  return a / b
}
