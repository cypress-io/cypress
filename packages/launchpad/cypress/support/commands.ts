import { registerMountFn } from '@packages/frontend-shared/cypress/support/commands'
import { createI18n } from '@packages/launchpad/src/locales/i18n'

registerMountFn({ plugins: [() => createI18n()] })
