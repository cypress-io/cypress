/* eslint-disable quotes */

const eslintRe = /\/. eslint.+\s+/g

// The kitchensink app and specs are authored against a local dev server on port
// 8080. Retarget them at the deployed https://example.cypress.io so the copied
// specs pass when scaffolded into a user's project.
export function convertExampleContent (str: string): string {
  const replace = function (source: string | RegExp, dest: string) {
    str = str.split(source).join(dest)
  }

  replace('http://localhost:8080', 'https://example.cypress.io')
  replace("to.eq('localhost:8080')", "to.eq('example.cypress.io')")
  replace("to.eq('localhost')", "to.eq('example.cypress.io')")
  replace("to.eq('8080')", "to.eq('')")
  replace("to.eq('http:')", "to.eq('https:')")
  replace(eslintRe, "")
  replace("imgSrcToDataURL('/assets", "imgSrcToDataURL('https://example.cypress.io/assets")

  return str
}
