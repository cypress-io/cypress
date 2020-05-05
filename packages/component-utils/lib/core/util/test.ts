// Split out for unit testing purposes
export const key = (): string => (Cypress?.mocha?.getRunner()?.test?.title || '') + Math.random()
