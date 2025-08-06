export interface AssertionOption {
  name?: string
  value?: string | number | string[]
}

export interface AssertionType {
  type: string
  options?: AssertionOption[]
}

export type PossibleAssertions = AssertionType[]

// Single argument assertion: ['be.visible']
export type AssertionArgs_1 = [string]

// Two argument assertion: ['have.text', '<some text>']
export type AssertionArgs_2 = [string, string]

// Three argument assertion: ['have.attr', 'href', '<some value>']
export type AssertionArgs_3 = [string, string, string]

export type AssertionArgs = AssertionArgs_1 | AssertionArgs_2 | AssertionArgs_3

export type AddAssertion = (
  $el: HTMLElement | JQuery<HTMLElement>,
  ...args: AssertionArgs
) => void
