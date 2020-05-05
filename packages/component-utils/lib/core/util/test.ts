// Split out for unit testing purposes
// @ts-ignore
export const key = (): string => (Cypress?.mocha?.getRunner()?.test?.title || '') + Math.random()
