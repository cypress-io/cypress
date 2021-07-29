import { inputObjectType, mutationType, nonNull } from 'nexus'
import { BundlerEnum, FrontendFrameworkEnum, TestingTypeEnum } from '../constants'

export const mutation = mutationType({
  definition (t) {
    // TODO(tim): in nexus, support for t.wizard(...)

    t.field('wizardSetTestingType', {
      type: 'Wizard',
      description: 'Sets the current testing type we want to use',
      args: { type: nonNull(TestingTypeEnum) },
      resolve: (root, args, ctx) => ctx.wizard.setTestingType(args.type),
    })

    t.field('wizardSetFramework', {
      type: 'Wizard',
      description: 'Sets the frontend framework we want to use for the project',
      args: { framework: nonNull(FrontendFrameworkEnum) },
      resolve: (_, args, ctx) => ctx.wizard.setFramework(args.framework),
    })

    t.field('wizardNavigateForward', {
      type: 'Wizard',
      description: 'Navigates forward in the wizard',
      resolve: (_, __, ctx) => ctx.wizard.navigateForward(),
    })

    t.field('wizardNavigateBack', {
      type: 'Wizard',
      description: 'Navigates backward in the wizard',
      resolve: (_, __, ctx) => ctx.wizard.navigateBack(),
    })

    t.field('wizardSetBundler', {
      type: 'Wizard',
      description: 'Sets the frontend bundler we want to use for the project',
      args: {
        name: BundlerEnum,
      },
      resolve: (root, args, ctx) => ctx.wizard.setBundler(args.name),
    })

    t.field('wizardInstallDependencies', {
      type: 'Wizard',
      description: 'Installs the dependencies for the component testing step',
      resolve: (root, args, ctx) => ctx.wizard,
    })

    t.field('wizardValidateManualInstall', {
      type: 'Wizard',
      description: 'Validates that the manual install has occurred properly',
      resolve: (root, args, ctx) => {
        return ctx.wizard.validateManualInstall()
      },
    })

    t.nonNull.field('addProject', {
      type: 'Project',
      description: 'Adds a new project to the app',
      args: {
        input: nonNull(
          inputObjectType({
            name: 'AddProjectInput',
            definition (t) {
              t.nonNull.string('projectRoot')
              t.nonNull.string('testingType')
              t.nonNull.boolean('isCurrent')
            },
          }),
        ),
      },
      async resolve (_root, args, ctx) {
        const addedProject = await ctx.actions.addProject(args.input)

        return addedProject
      },
    })

    t.field('initializePlugins', {
      type: 'Project',
      description: 'Initializes the plugins for the current active project',
      async resolve (_root, args, ctx) {
        // TODO: should we await here, or return a pending state to the client?
        return await ctx.activeProject?.initializePlugins() ?? null
      },
    })
  },
})
