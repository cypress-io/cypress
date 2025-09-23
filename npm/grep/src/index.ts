import { register } from './register'

// NOTE: we cannot import the plugin here because it is designed to run in the node context.
// when we import the register function, it will then also import the plugin references which will fail in the browser.
declare global {
  namespace Cypress {
   interface SuiteConfigOverrides {
     /**
      * List of tags for this suite
      * @example a single tag
      *  describe('block with config tag', { tags: '@smoke' }, () => {})
      * @example multiple tags
      *  describe('block with config tag', { tags: ['@smoke', '@slow'] }, () => {})
      */
     tags?: string | string[]
   }

   // specify additional properties in the TestConfig object
   // in our case we will add "tags" property
   interface TestConfigOverrides {
     /**
      * List of tags for this test
      * @example a single tag
      *  it('logs in', { tags: '@smoke' }, () => { ... })
      * @example multiple tags
      *  it('works', { tags: ['@smoke', '@slow'] }, () => { ... })
      */
     tags?: string | string[]
   }

   interface Cypress {
     grep: (grep?: string, tags?: string, burn?: string) => void
   }
 }
}

export { register }
