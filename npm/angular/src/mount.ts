import 'zone.js'

/**
 * @hack fixes "Mocha has already been patched with Zone" error.
 */
// @ts-ignore
window.Mocha['__zone_patch__'] = false
import 'zone.js/testing'

import { CommonModule } from '@angular/common'
import { Component, ErrorHandler, EventEmitter, Injectable, SimpleChange, SimpleChanges, Type, OnChanges } from '@angular/core'
import {
  ComponentFixture,
  getTestBed,
  TestModuleMetadata,
  TestBed,
  TestComponentRenderer,
} from '@angular/core/testing'
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing'
import {
  setupHooks,
  getContainerEl,
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

let activeFixture: ComponentFixture<any> | null = null

function cleanup () {
  // Not public, we need to call this to remove the last component from the DOM
  try {
    (getTestBed() as any).tearDownTestingModule()
  } catch (e) {
    const notSupportedError = new Error(`Failed to teardown component. The version of Angular you are using may not be officially supported.`)

    ;(notSupportedError as any).docsUrl = 'https://on.cypress.io/component-framework-configuration'
    throw notSupportedError
  }

  getTestBed().resetTestingModule()
  activeFixture = null
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

// 'zone.js/testing' is not properly aliasing `it.skip` but it does provide `xit`/`xspecify`
// Written up under https://github.com/angular/angular/issues/46297 but is not seeing movement
// so we'll patch here pending a fix in that library
// @ts-ignore Ignore so that way we can bypass semantic error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
globalThis.it.skip = globalThis.xit

@Injectable()
class CypressAngularErrorHandler implements ErrorHandler {
  handleError (error: Error): void {
    throw error
  }
}

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

  if (!testModuleMetaData.providers) {
    testModuleMetaData.providers = []
  }

  // Replace default error handler since it will swallow uncaught exceptions.
  // We want these to be uncaught so Cypress catches it and fails the test
  testModuleMetaData.providers.push({
    provide: ErrorHandler,
    useClass: CypressAngularErrorHandler,
  })

  // check if the component is a standalone component
  if ((component as any).ɵcmp?.standalone) {
    testModuleMetaData.imports.push(component)
  } else {
    testModuleMetaData.declarations.push(component)
  }

  if (!testModuleMetaData.imports.includes(CommonModule)) {
    testModuleMetaData.imports.push(CommonModule)
  }

  return testModuleMetaData
}

@Injectable()
export class CypressTestComponentRenderer extends TestComponentRenderer {
  override insertRootElement (rootElId: string) {
    this.removeAllRootElements()

    const rootElement = getContainerEl()

    rootElement.setAttribute('id', rootElId)
  }

  override removeAllRootElements () {
    getContainerEl().innerHTML = ''
  }
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
  const componentFixture = createComponentFixture(component) as Type<T>

  getTestBed().configureTestingModule({
    ...bootstrapModule(componentFixture, config),
  })

  getTestBed().overrideProvider(TestComponentRenderer, { useValue: new CypressTestComponentRenderer() })

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
    // getTestBed().overrideTemplate is available in v14+
    // The static TestBed.overrideTemplate is available across versions
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
  const fixture = getTestBed().createComponent(component)

  setupComponent(config, fixture)

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
): void {
  let component = fixture.componentInstance as unknown as { [key: string]: any } & Partial<OnChanges>

  if (config?.componentProperties) {
    component = Object.assign(component, config.componentProperties)
  }

  if (config.autoSpyOutputs) {
    Object.keys(component).forEach((key) => {
      const property = component[key]

      if (property instanceof EventEmitter) {
        component[key] = createOutputSpy(`${key}Spy`)
      }
    })
  }

  // Manually call ngOnChanges when mounting components using the class syntax.
  // This is necessary because we are assigning input values to the class directly
  // on mount and therefore the ngOnChanges() lifecycle is not triggered.
  if (component.ngOnChanges && config.componentProperties) {
    const { componentProperties } = config

    const simpleChanges: SimpleChanges = Object.entries(componentProperties).reduce((acc, [key, value]) => {
      acc[key] = new SimpleChange(null, value, true)

      return acc
    }, {} as {[key: string]: SimpleChange})

    if (Object.keys(componentProperties).length > 0) {
      component.ngOnChanges(simpleChanges)
    }
  }
}

/**
 * Mounts an Angular component inside Cypress browser
 *
 * @param component Angular component being mounted or its template
 * @param config configuration used to configure the TestBed
 * @example
 * import { mount } from '@cypress/angular'
 * import { StepperComponent } from './stepper.component'
 * import { MyService } from 'services/my.service'
 * import { SharedModule } from 'shared/shared.module';
 * it('mounts', () => {
 *    mount(StepperComponent, {
 *      providers: [MyService],
 *      imports: [SharedModule]
 *    })
 *    cy.get('[data-cy=increment]').click()
 *    cy.get('[data-cy=counter]').should('have.text', '1')
 * })
 *
 * // or
 *
 * it('mounts with template', () => {
 *   mount('<app-stepper></app-stepper>', {
 *     declarations: [StepperComponent],
 *   })
 * })
 *
 * @see {@link https://on.cypress.io/mounting-angular} for more details.
 *
 * @returns A component and component fixture
 */
export function mount<T> (
  component: Type<T> | string,
  config: MountConfig<T> = { },
): Cypress.Chainable<MountResponse<T>> {
  // Remove last mounted component if cy.mount is called more than once in a test
  if (activeFixture) {
    cleanup()
  }

  const componentFixture = initTestBed(component, config)

  activeFixture = setupFixture(componentFixture, config)

  const mountResponse: MountResponse<T> = {
    fixture: activeFixture,
    component: activeFixture.componentInstance,
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
 * @example
 * import { StepperComponent } from './stepper.component'
 * import { mount, createOutputSpy } from '@cypress/angular'
 *
 * it('Has spy', () => {
 *   mount(StepperComponent, { componentProperties: { change: createOutputSpy('changeSpy') } })
 *   cy.get('[data-cy=increment]').click()
 *   cy.get('@changeSpy').should('have.been.called')
 * })
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

setupHooks(cleanup)
