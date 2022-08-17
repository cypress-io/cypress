import 'zone.js'

/**
 * @hack fixes "Mocha has already been patched with Zone" error.
 */
// @ts-ignore
window.Mocha['__zone_patch__'] = false
import 'zone.js/testing'

import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Type } from '@angular/core'
import {
  ComponentFixture,
  getTestBed,
  TestBed,
  TestModuleMetadata,
} from '@angular/core/testing'
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing'
import {
  setupHooks,
} from '@cypress/mount-utils'

/**
 * Additional module configurations needed while mounting the component, like
 * providers, declarations, imports and even component @Inputs()
 *
 *
 * @interface MountConfig
 * @see https://angular.io/api/core/testing/TestModuleMetadata
 */
export interface MountConfig<T> extends TestModuleMetadata {
  /**
   * @memberof MountConfig
   * @description flag to automatically create a cy.spy() for every component @Output() property
   * @example
   * export class ButtonComponent {
   *  @Output clicked = new EventEmitter()
   * }
   *
   * cy.mount(ButtonComponent, { autoSpyOutputs: true })
   * cy.get('@clickedSpy).should('have.been.called')
   */
  autoSpyOutputs?: boolean

  /**
   * @memberof MountConfig
   * @description flag defaulted to true to automatically detect changes in your components
   */
  autoDetectChanges?: boolean
  /**
   * @memberof MountConfig
   * @example
   * import { ButtonComponent } from 'button/button.component'
   * it('renders a button with Save text', () => {
   *  cy.mount(ButtonComponent, { componentProperties: { text: 'Save' }})
   *  cy.get('button').contains('Save')
   * })
   *
   * it('renders a button with a cy.spy() replacing EventEmitter', () => {
   *  cy.mount(ButtonComponent, {
   *    componentProperties: {
   *      clicked: cy.spy().as('mySpy)
   *    }
   *  })
   *  cy.get('button').click()
   *  cy.get('@mySpy').should('have.been.called')
   * })
   */
  componentProperties?: Partial<{ [P in keyof T]: T[P] }>
}

/**
 * Type that the `mount` function returns
 * @type MountResponse<T>
 */
export type MountResponse<T> = {
  /**
   * Fixture for debugging and testing a component.
   *
   * @memberof MountResponse
   * @see https://angular.io/api/core/testing/ComponentFixture
   */
  fixture: ComponentFixture<T>

  /**
   * The instance of the root component class
   *
   * @memberof MountResponse
   * @see https://angular.io/api/core/testing/ComponentFixture#componentInstance
   */
  component: T
};

/**
 * Bootstraps the TestModuleMetaData passed to the TestBed
 *
 * @param {Type<T>} component Angular component being mounted
 * @param {MountConfig} config TestBed configuration passed into the mount function
 * @returns {MountConfig} MountConfig
 */
function bootstrapModule<T> (
  component: Type<T>,
  config: MountConfig<T>,
): MountConfig<T> {
  const { componentProperties, ...testModuleMetaData } = config

  if (!testModuleMetaData.declarations) {
    testModuleMetaData.declarations = []
  }

  if (!testModuleMetaData.imports) {
    testModuleMetaData.imports = []
  }

  // check if the component is a standalone component
  if ((component as any).ɵcmp.standalone) {
    testModuleMetaData.imports.push(component)
  } else {
    testModuleMetaData.declarations.push(component)
  }

  if (!testModuleMetaData.imports.includes(CommonModule)) {
    testModuleMetaData.imports.push(CommonModule)
  }

  return testModuleMetaData
}

/**
 * Initializes the TestBed
 *
 * @param {Type<T> | string} component Angular component being mounted or its template
 * @param {MountConfig} config TestBed configuration passed into the mount function
 * @returns {Type<T>} componentFixture
 */
function initTestBed<T> (
  component: Type<T> | string,
  config: MountConfig<T>,
): Type<T> {
  const { providers, ...configRest } = config

  const componentFixture = createComponentFixture(component) as Type<T>

  TestBed.configureTestingModule({
    ...bootstrapModule(componentFixture, configRest),
  })

  if (providers != null) {
    TestBed.overrideComponent(componentFixture, {
      add: {
        providers,
      },
    })
  }

  return componentFixture
}

@Component({ selector: 'cy-wrapper-component', template: '' })
class WrapperComponent { }

/**
 * Returns the Component if Type<T> or creates a WrapperComponent
 *
 * @param {Type<T> | string} component The component you want to create a fixture of
 * @returns {Type<T> | WrapperComponent}
 */
function createComponentFixture<T> (
  component: Type<T> | string,
): Type<T | WrapperComponent> {
  if (typeof component === 'string') {
    TestBed.overrideTemplate(WrapperComponent, component)

    return WrapperComponent
  }

  return component
}

/**
 * Creates the ComponentFixture
 *
 * @param {Type<T>} component Angular component being mounted
 * @param {MountConfig<T>} config MountConfig

 * @returns {ComponentFixture<T>} ComponentFixture
 */
function setupFixture<T> (
  component: Type<T>,
  config: MountConfig<T>,
): ComponentFixture<T> {
  const fixture = TestBed.createComponent(component)

  fixture.whenStable().then(() => {
    fixture.autoDetectChanges(config.autoDetectChanges ?? true)
  })

  return fixture
}

/**
 * Gets the componentInstance and Object.assigns any componentProperties() passed in the MountConfig
 *
 * @param {MountConfig} config TestBed configuration passed into the mount function
 * @param {ComponentFixture<T>} fixture Fixture for debugging and testing a component.
 * @returns {T} Component being mounted
 */
function setupComponent<T> (
  config: MountConfig<T>,
  fixture: ComponentFixture<T>,
): T {
  let component: T = fixture.componentInstance

  if (config?.componentProperties) {
    component = Object.assign(component, config.componentProperties)
  }

  if (config.autoSpyOutputs) {
    Object.keys(component).forEach((key: string, index: number, keys: string[]) => {
      const property = component[key]

      if (property instanceof EventEmitter) {
        component[key] = createOutputSpy(`${key}Spy`)
      }
    })
  }

  return component
}

/**
 * Mounts an Angular component inside Cypress browser
 *
 * @param {Type<T> | string} component Angular component being mounted or its template
 * @param {MountConfig<T>} config configuration used to configure the TestBed
 * @example
 * import { HelloWorldComponent } from 'hello-world/hello-world.component'
 * import { MyService } from 'services/my.service'
 * import { SharedModule } from 'shared/shared.module';
 * import { mount } from '@cypress/angular'
 * it('can mount', () => {
 *  mount(HelloWorldComponent, {
 *    providers: [MyService],
 *    imports: [SharedModule]
 *  })
 *  cy.get('h1').contains('Hello World')
 * })
 *
 * or
 *
 * it('can mount with template', () => {
 *  mount('<app-hello-world></app-hello-world>', {
 *    declarations: [HelloWorldComponent],
 *    providers: [MyService],
 *    imports: [SharedModule]
 *  })
 * })
 * @returns Cypress.Chainable<MountResponse<T>>
 */
export function mount<T> (
  component: Type<T> | string,
  config: MountConfig<T> = { },
): Cypress.Chainable<MountResponse<T>> {
  const componentFixture = initTestBed(component, config)
  const fixture = setupFixture(componentFixture, config)
  const componentInstance = setupComponent(config, fixture)

  const mountResponse: MountResponse<T> = {
    fixture,
    component: componentInstance,
  }

  const logMessage = typeof component === 'string' ? 'Component' : componentFixture.name

  Cypress.log({
    name: 'mount',
    message: logMessage,
    consoleProps: () => ({ result: mountResponse }),
  })

  return cy.wrap(mountResponse, { log: false })
}

/**
 * Creates a new Event Emitter and then spies on it's `emit` method
 *
 * @param {string} alias name you want to use for your cy.spy() alias
 * @returns EventEmitter<T>
 */
export const createOutputSpy = <T>(alias: string) => {
  const emitter = new EventEmitter<T>()

  cy.spy(emitter, 'emit').as(alias)

  return emitter as any
}

// Only needs to run once, we reset before each test
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: false },
  },
)

setupHooks(() => {
  // Not public, we need to call this to remove the last component from the DOM
  TestBed['tearDownTestingModule']()
  TestBed.resetTestingModule()
})
