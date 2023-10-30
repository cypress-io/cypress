// import path from 'path'
// import fs from 'fs-extra'
// import dedent from 'dedent'

// import { monorepoPaths } from '../monorepoPaths'

/**
 * TODO(tim): revisit to see if this is useful
 * Rather than copy-paste the Cypress d.ts into the @packages/types, we can regex out the ones we want -
 * so we keep a single source of truth updated while getting the types we need for type-safety without
 * leaking globals from everything into the server-side app
 */
// export async function extractCypressNamespacedTypes () {
//   const cypressTypeFile = await fs.readFile(path.join(monorepoPaths.root, 'cli/types/cypress.d.ts'), 'utf8')
//   const interfacesToExtract: Record<string, RegExp> = {
//     RuntimeConfigOptions: /( +)interface RuntimeConfigOptions {((\s|.)*?)(\1)}\n\n/gm,
//     ResolvedConfigOptions: /( +)interface ResolvedConfigOptions {((\s|.)*?)(\1)}\n\n/gm,
//     Browser: /( +)interface Browser {((\s|.)*?)(\1)}\n\n/gm,
//     RemoteState: /( +)interface RemoteState {((\s|.)*?)(\1)}\n\n/gm,
//     Spec: /( +)interface Spec {((\s|.)*?)(\1)}\n\n/gm,
//     ClientCertificate: /( +)interface ClientCertificate {((\s|.)*?)(\1)}\n\n/gm,
//     PEMCert: /( +)interface PEMCert {((\s|.)*?)(\1)}\n\n/gm,
//     PFXCert: /( +)interface PFXCert {((\s|.)*?)(\1)}\n\n/gm,
//     BrowserName: /( +)type BrowserName = (.*?)\n/gm,
//     BrowserChannel: /( +)type BrowserChannel = (.*?)\n/gm,
//     BrowserFamily: /( +)type BrowserFamily = (.*?)\n/gm,
//     CypressSpecType: /( +)type CypressSpecType = (.*?)\n/gm,
//     scrollBehaviorOptions: /( +)type scrollBehaviorOptions = (.*?)\n/gm,
//     TestingType: /( +)type TestingType = (.*?)\n/gm,
//   }

//   const typeDefs: string[] = []

//   for (const key of Object.keys(interfacesToExtract).sort()) {
//     const matched = cypressTypeFile.match(interfacesToExtract[key])

//     if (!matched) {
//       throw new Error(`Missing ${key} in extractCypressNamespacedTypes: ${__filename}`)
//     }

//     if (matched.length > 1) {
//       throw new Error(`Multiple matches for ${key} in extractCypressNamespacedTypes: ${__filename}`)
//     }

//     typeDefs.push(matched[0])
//   }

//   const typesToPrint = [
//     typeDefs.map((def) => `// Auto-generated by ${__filename}, do not edit this type directly\nexport ${dedent(def)}\n`).join('\n'),
//   ].join('\n')

//   const fileContents = `type Nullable<T> = T | null\n\n${typesToPrint}`

//   await fs.writeFile(path.join(monorepoPaths.pkgTypes, 'src/cypress-extracted.gen.ts'), fileContents)
// }
