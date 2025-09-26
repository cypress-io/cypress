export const sharedFunction = () => {
  return 'Hello from shared package!'
}

export const useLodash = () => {
  // This will be available through the workspace dependency
  return 'Lodash is available'
}
