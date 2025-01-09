import 'zone.js'

/**
 * @hack fixes "Mocha has already been patched with Zone" error.
 */
// @ts-ignore
window.Mocha['__zone_patch__'] = false
import 'zone.js/testing'

import { CommonModule } from '@angular/common'
import { Component, ErrorHandler, EventEmitter, Injectable, SimpleChange, SimpleChanges, Type, OnChanges, Injector, InputSignal, WritableSignal, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
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
import type { Subscription } from 'rxjs'

/**
 * Additional module configurations needed while mounting the component, like
 * providers, declarations, imports and even component @Inputs()
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
  // allow InputSignals to be type primitive and WritableSignal for type compliance
  componentProperties?: Partial<{ [P in keyof T]: T[P] extends InputSignal<infer V> ? InputSignal<V> | WritableSignal<V> | V : T[P]}>
}

let activeFixture: ComponentFixture<any> | null = null
let activeInternalSubscriptions: Subscription[] = []

function cleanup () {
  // Not public, we need to call this to remove the last component from the DOM
  try {
    (getTestBed() as any).tearDownTestingModule()
  } catch (e) {
    const notSupportedError = new Error(`Failed to teardown component. The version of Angular you are using may not be officially supported.`)

    ;(notSupportedError as any).docsUrl = 'https://on.cypress.io/frameworks'
    throw notSupportedError
  }

  // clean up internal subscriptions if any exist. We use this for two-way data binding for
  // signal() models
  activeInternalSubscriptions.forEach((subscription) => {
    subscription.unsubscribe()
  })

  getTestBed().resetTestingModule()
  activeFixture = null
  activeInternalSubscriptions = []
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

// if using the Wrapper Component (template strings), the component itself cannot be
// a standalone component
@Component({ selector: 'cy-wrapper-component', template: '', standalone: false })
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
  }).catch((e) => {
    // If this promise does not settle in Angular 19 it is rejected
    // https://github.com/angular/angular/blob/main/CHANGELOG.md#1900-2024-11-19
    // eslint-disable-next-line no-console
    console.error(e)
  })

  return fixture
}

// Best known way to currently detect whether or not a function is a signal is if the signal symbol exists.
// From there, we can take our best guess based on what exists on the object itself.
// @see https://github.com/cypress-io/cypress/issues/29731.
function isSignal (prop: any): boolean {
  try {
    const symbol = Object.getOwnPropertySymbols(prop).find((symbol) => symbol.toString() === 'Symbol(SIGNAL)')

    return !!symbol
  } catch (e) {
    // likely a primitive type, object, array, or something else (i.e. not a signal).
    // We can return false here.
    return false
  }
}

// currently not a great way to detect if a function is an InputSignal.
// @see https://github.com/cypress-io/cypress/issues/29731.
function isInputSignal (prop: any): boolean {
  return isSignal(prop) && typeof prop === 'function' && prop['name'] === 'inputValueFn'
}

// currently not a great way to detect if a function is a Model Signal.
// @see https://github.com/cypress-io/cypress/issues/29731.
function isModelSignal (prop: any): boolean {
  return isSignal(prop) && isWritableSignal(prop) && typeof prop.subscribe === 'function'
}

// currently not a great way to detect if a function is a Writable Signal.
// @see https://github.com/cypress-io/cypress/issues/29731.
function isWritableSignal (prop: any): boolean {
  return isSignal(prop) && typeof prop === 'function' && typeof prop.set === 'function'
}

function convertPropertyToSignalIfApplicable (propValue: any, componentValue: any, injector: Injector) {
  const isComponentValueAnInputSignal = isInputSignal(componentValue)
  const isComponentValueAModelSignal = isModelSignal(componentValue)
  let convertedValueIfApplicable = propValue

  // If the component has the property defined as an InputSignal, we need to detect whether a non signal value or not was passed into the component as a prop
  // and attempt to merge the value in correctly.
  // We don't want to expose the primitive created signal as it should really be one-way binding from within the component.
  // However, to make CT testing easier, a user can technically pass in a signal to an input component and assert on the signal itself and pass in updates
  // down to the component as 1 way binding is supported by the test harness
  if (isComponentValueAnInputSignal) {
    const isPassedInValueNotASignal = !isSignal(propValue)

    if (isPassedInValueNotASignal) {
      // Input signals require an injection context to set initial values.
      // Because of this, we cannot create them outside the scope of the component.
      // Options for input signals also don't allow the passing of an injection contexts, so in order to work around this,
      // we convert the non signal input passed into the input to a writable signal
      convertedValueIfApplicable = signal(propValue)
    }

    // If the component has the property defined as a ModelSignal, we need to detect whether a signal value or not was passed into the component as a prop.
    // If a non signal property is passed into the component model (primitive, object, array, etc), we need to set the model to that value and propagate changes of that model through the output spy.
    // Since the non signal type likely lives outside the context of Angular, the non signal type will NOT be updated outside of this context. Instead, the output spy will allow you
    // to see this change.
    // If the value passed into the property is in fact a signal, we need to set up two-way binding between the signals to make sure changes from one propagate to the other.
  } else if (isComponentValueAModelSignal) {
    const isPassedInValueLikelyARegularSignal = isWritableSignal(propValue)

    // if the value passed into the component is a signal, set up two-way binding
    if (isPassedInValueLikelyARegularSignal) {
      // update the passed in value with the models updates
      componentValue.subscribe((value: any) => {
        propValue.set(value)
      })

      // update the model signal with the properties updates
      const convertedToObservable = toObservable(propValue, {
        injector,
      })

      // push the subscription into an array to be cleaned up at the end of the test
      // to prevent a memory leak
      activeInternalSubscriptions.push(
        convertedToObservable.subscribe((value) => {
          componentValue.set(value)
        }),
      )
    } else {
      // it's a non signal type, set it as we only need to handle updating the model signal and emit changes on this through the output spy.
      componentValue.set(propValue)

      convertedValueIfApplicable = componentValue
    }
  }

  return convertedValueIfApplicable
}

// In the case of signals, if we need to create an output spy, we need to check first whether or not a user has one defined first or has it created through
// autoSpyOutputs. If so, we need to subscribe to the writable signal to push updates into the event emitter. We do NOT observe input signals and output spies will not
// work for input signals.
function detectAndRegisterOutputSpyToSignal<T> (config: MountConfig<T>, component: { [key: string]: any } & Partial<OnChanges>, key: string, injector: Injector): void {
  if (config.componentProperties) {
    const expectedChangeKey = `${key}Change`
    let changeKeyIfExists = !!Object.keys(config.componentProperties).find((componentKey) => componentKey === expectedChangeKey)

    // since spies do NOT make change handlers by default, similar to the Output() decorator, we need to create the spy and subscribe to the signal
    if (!changeKeyIfExists && config.autoSpyOutputs) {
      component[expectedChangeKey] = createOutputSpy(`${expectedChangeKey}Spy`)
      changeKeyIfExists = true
    }

    if (changeKeyIfExists) {
      const componentValue = component[key]

      // if the user passed in a change key or we created one due to config.autoSpyOutputs being set to true for a given signal,
      // we will create a subscriber that will emit an event every time the value inside the signal changes. We only do this
      // if the signal is writable and not an input signal.
      if (isWritableSignal(componentValue) && !isInputSignal(componentValue)) {
        toObservable(componentValue, {
          injector,
        }).subscribe((value) => {
          component[expectedChangeKey]?.emit(value)
        })
      }
    }
  }
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
  const injector = fixture.componentRef.injector

  if (config?.componentProperties) {
    // convert primitives to signals if passed in type is a primitive but expected type is signal
    // a bit of magic. need to move to another function
    Object.keys(component).forEach((key) => {
      // only assign props if they are passed into the component
      if (config?.componentProperties?.hasOwnProperty(key)) {
        // @ts-expect-error
        const passedInValue = config?.componentProperties[key]

        const componentValue = component[key]

        // @ts-expect-error
        config.componentProperties[key] = convertPropertyToSignalIfApplicable(passedInValue, componentValue, injector)
        detectAndRegisterOutputSpyToSignal(config, component, key, injector)
      }
    })

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
 *
 * // Or for use with Angular Signals following the output nomenclature.
 * // see https://v17.angular.io/guide/model-inputs#differences-between-model-and-input/
 *
 * it('Has spy', () => {
 *   mount(StepperComponent, { componentProperties: { count: signal(0), countChange: createOutputSpy('countChange') } })
 *   cy.get('[data-cy=increment]').click()
 *   cy.get('@countChange').should('have.been.called')
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
