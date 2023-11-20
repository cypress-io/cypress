export interface AssertionOption {
  name?: string
  value?: string | number | string[]
}

export type PossibleAssertions = Array<{ type: string, options?: AssertionOption[] }>

// Single argument assertion: ['be.visible']
type AssertionArgs_1 = [string]
// Two argument assertion: ['have.text', '<some text>']
type AssertionArgs_2 = [string, string]
// Three argument assertion: ['have.attr', 'href', '<some value>']
type AssertionArgs_3 = [string, string, string]

export type AssertionArgs = AssertionArgs_1 | AssertionArgs_2 | AssertionArgs_3

export type AddAssertion = ($el: HTMLElement | JQuery<HTMLElement>, ...args: AssertionArgs) => void
