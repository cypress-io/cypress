// TODO: Why is this failing on CI?
//
// import {
//   ConfigFileFragment,
//   ConfigFileFragmentDoc,
//   ProjectRootFragment,
//   ProjectRootFragmentDoc,
// } from '../generated/graphql-test'
// import ConfigFile from './ConfigFile.vue'
//
// // TODO: failing on CI. Find out why.
// describe('<ConfigFile />', () => {
//   beforeEach(() => {
//     cy.mountFragmentList([
//       ConfigFileFragmentDoc,
//       ProjectRootFragmentDoc,
//     ], {
//       type: (ctx) => {
//         ctx.wizard.setFramework('cra')
//         ctx.wizard.setBundler('webpack')
//
//         return [ctx.wizard, ctx.app]
//       },
//       render: (gql) => {
//         // @ts-ignore - TODO: fix types
//         const wizard = gql.wizard as any as ConfigFileFragment
//         // @ts-ignore - TODO: fix types
//         const app = gql.app as any as ProjectRootFragment
//
//         return (
//           <ConfigFile
//             wizard={wizard}
//             app={app}
//           />
//         )
//       },
//     })
//   })
//
//   it('playground', { viewportWidth: 1280, viewportHeight: 1024 }, () => {
//     cy.contains('button', 'JavaScript').click()
//   })
//
//   it('should display a copy button when in manual mode', () => {
//     cy.contains('Copy').should('not.exist')
//     cy.contains('Create file manually').click()
//     cy.contains('Copy').should('exist')
//   })
// })
