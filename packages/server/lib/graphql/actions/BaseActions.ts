import { BaseContext } from '../context/BaseContext'

/**
 * Acts as the contract for all actions, implemented by ServerActions
 * and ClientTestActions
 */
export abstract class BaseActions {
  constructor (protected ctx: BaseContext) {}

  abstract installDependencies (): void
}
