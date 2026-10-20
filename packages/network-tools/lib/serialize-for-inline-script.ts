export const serializeForInlineScript = (value: unknown) => {
  return JSON.stringify(value ?? null).replace(/[<>\u2028\u2029]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
  })
}
