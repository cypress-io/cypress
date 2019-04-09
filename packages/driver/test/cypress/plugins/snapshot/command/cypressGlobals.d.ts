/// <reference types="cypress" />

	namespace Cypress {
		interface Cypress {
				/**
				 * Gets the current test. Added by cypress-plugin-retries
				 */
				currentTest: Mocha.ISuiteCallbackContext
				mocha: any
				sinon: any
		}

		interface LogConfig {
			state: string
		}

	}

	namespace Chai {
		interface ChaiStatic {
			Assertion: any
		}
	}

