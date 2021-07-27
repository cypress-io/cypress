import { mutationType, nonNull } from 'nexus'
import { BundlerEnum, FrontendFrameworkEnum, TestingTypeEnum } from '../constants'

export const mutation = mutationType({
  definition (t) {
    // TODO(tim): in nexus, allow for t.wizard(...)

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

    t.field('wizardNavigateBack', {
      type: 'Wizard',
      description: 'Navigates backward in the wizard',
      args: { type: nonNull(TestingTypeEnum) },
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
        return ctx.wizard
      },
    })
  },
})
