export * from "./dist"

declare global{
	interface Window {
		Cypress: Cypress.Cypress
		global?: Window & globalThis
	}

	interface ImportMeta {
		env: {
			__cypress_supportPath: string
			__cypress_originAutUrl: string
			__cypress_projectRoot: string
		};
	  }
}