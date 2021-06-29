import { nxs, NxsMutationArgs } from 'nexus-decorators'

export const WizardCurrentStep = nxs.enumType('CurrentStep', ['selectFramework', 'installDependencies'])

@nxs.objectType({
  description: 'Groups all actions & data associated with the onboarding wizard',
})
export class Wizard {
  @nxs.queryField({
    type: 'Wizard',
    description: 'Returns metadata associated with the onboarding wizard',
  })
  static wizard () {
    return new Wizard()
  }

  @nxs.mutationField({
    type: 'Query',
    args (t) {
      t.string('type')
    },
  })
  static wizardSetTestingType (args: NxsMutationArgs<'wizardSetTestingType'>, ctx) {}

  @nxs.mutationField({ type: 'Wizard' })
  static wizardSetDismissedHelper () {
    Wizard._showNewUserWelcome = false

    return new Wizard()
  }

  @nxs.mutationField({ type: 'Query' })
  static wizardSetComponentFramework () {}

  @nxs.field.string()
  static packageManager () {
    // Resolve package manager
    return 'yarn'
  }

  private static _showNewUserWelcome = true

  @nxs.field.boolean()
  showNewUserWelcome (args, ctx, info) {
    return Wizard._showNewUserWelcome
  }

  @nxs.field.list.type(() => WizardDependency)
  dependenciesToInstall () {
    return []
  }

  @nxs.field.type(() => WizardCurrentStep)
  currentStep () {
    return 'selectFramework'
  }

  @nxs.field.boolean({
    description: 'Whether we can go to the next step in the onboarding flow',
  })
  canGoNextStep () {
    return false
  }

  @nxs.field.boolean({
    description: 'Whether we can go to the previous step in the onboarding flow',
  })
  canGoBackStep () {
    return false
  }
}

@nxs.objectType()
export class WizardDependency {
  @nxs.field.string()
  packageName () {
    return ''
  }

  @nxs.field.string()
  description () {
    return ''
  }
}
