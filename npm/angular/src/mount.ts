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

/**
 * Additional module configurations needed while mounting the component, like
 * providers, declarations, imports and even component @Inputs()
 *
 *
 * @interface TestBedConfig
 * @see https://angular.io/api/core/testing/TestModuleMetadata
 */
export interface TestBedConfig<T extends object> extends TestModuleMetadata {
  /**
   * @memberof TestBedConfig
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
  componentProperties?: Partial<{ [P in keyof T]: T[P] extends { emit }
    ? Cypress.SinonSpyAgent<any> | EventEmitter<any>
    : T[P] }>
}

/**
 * Type that the `mount` function returns
 * @type MountResponse<T>
 */
export type MountResponse<T extends object> = {
  /**
   * Fixture for debugging and testing a component.
   *
   * @memberof MountResponse
   * @see https://angular.io/api/core/testing/ComponentFixture
   */
  fixture: ComponentFixture<T>

  /**
   * Configures and initializes environment and provides methods for creating components and services.
   *
   * @memberof MountResponse
   * @see https://angular.io/api/core/testing/TestBed
   */
  testBed: TestBed

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
 * @param {TestBedConfig} config TestBed configuration passed into the mount function
 * @returns {TestBedConfig} TestBedConfig
 */
function bootstrapModule<T extends object> (
  component: Type<T>,
  config: TestBedConfig<T>,
): TestBedConfig<T> {
  const { componentProperties, ...testModuleMetaData } = config

  if (!testModuleMetaData.declarations) {
    testModuleMetaData.declarations = []
  }

  if (!testModuleMetaData.imports) {
    testModuleMetaData.imports = []
  }

  testModuleMetaData.declarations.push(component)

  if (!testModuleMetaData.imports.includes(CommonModule)) {
    testModuleMetaData.imports.push(CommonModule)
  }

  return testModuleMetaData
}

/**
 * Initializes the TestBed
 *
 * @param {Type<T> | string} component Angular component being mounted or its template
 * @param {TestBedConfig} config TestBed configuration passed into the mount function
 * @returns {TestBed} TestBed
 */
function initTestBed<T extends object> (
  component: Type<T> | string,
  config: TestBedConfig<T>,
): { testBed: TestBed, componentFixture: Type<T> } {
  const { providers, ...configRest } = config

  const testBed: TestBed = getTestBed()

  testBed.resetTestEnvironment()

  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
    {
      teardown: { destroyAfterEach: false },
    },
  )

  const componentFixture = createComponentFixture(component) as Type<T>

  testBed.configureTestingModule({
    ...bootstrapModule(componentFixture, configRest),
  })

  if (providers != null) {
    testBed.overrideComponent(componentFixture, {
      add: {
        providers,
      },
    })
  }

  return { testBed, componentFixture }
}

@Component({ selector: 'cy-wrapper-component', template: '' })
class WrapperComponent { }

/**
 * Returns the Component if Type<T> or creates a WrapperComponent
 *
 * @param {Type<T> | string} component The component you want to create a fixture of
 * @returns {Type<T> | WrapperComponent}
 */
function createComponentFixture<T extends object> (
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
 * @param {TestBed} testBed TestBed
 * @param {boolean} autoDetectChanges boolean flag defaulted to true that turns on change detection automatically
 * @returns {ComponentFixture<T>} ComponentFixture
 */
function setupFixture<T extends object> (
  component: Type<T>,
  testBed: TestBed,
  autoDetectChanges: boolean,
): ComponentFixture<T> {
  const fixture = testBed.createComponent(component)

  fixture.whenStable().then(() => {
    fixture.autoDetectChanges(autoDetectChanges)
  })

  return fixture
}

/**
 * Gets the componentInstance and Object.assigns any componentProperties() passed in the TestBedConfig
 *
 * @param {TestBedConfig} config TestBed configuration passed into the mount function
 * @param {ComponentFixture<T>} fixture Fixture for debugging and testing a component.
 * @returns {T} Component being mounted
 */
function setupComponent<T extends object> (
  config: TestBedConfig<T>,
  fixture: ComponentFixture<T>,
): T {
  let component: T = fixture.componentInstance

  if (config?.componentProperties) {
    component = Object.assign(component, config.componentProperties)
  }

  return component
}

/**
 * Mounts an Angular component inside Cypress browser
 *
 * @param {Type<T> | string} component Angular component being mounted or its template
 * @param {TestBedConfig<T>} config configuration used to configure the TestBed
 * @param {boolean} autoDetectChanges boolean flag defaulted to true that turns on change detection automatically
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
export function mount<T extends object> (
  component: Type<T> | string,
  config: TestBedConfig<T> = {},
  autoDetectChanges = true,
): Cypress.Chainable<MountResponse<T>> {
  const { testBed, componentFixture } = initTestBed(component, config)
  const fixture = setupFixture(componentFixture, testBed, autoDetectChanges)
  const componentInstance = setupComponent(config, fixture)

  const mountResponse: MountResponse<T> = {
    testBed,
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
