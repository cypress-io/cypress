/// <reference types="chai" />

declare global {
	namespace Chai {
			interface Assertion {
					matchEql(expected: any): Assertion
			}
			interface Assert {
					matchEql(val: any, exp: any, msg?: string): void
			}
	}
}

declare function matchEql(chai: any, utils: any): void
const m: Chai.Assertion

export = {
	m
}
