import { Type } from '@angular/core'
import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  getTestBed,
  TestBed,
  TestModuleMetadata,
} from '@angular/core/testing'
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing'
import { CypressAngularConfig } from './config'
import { injectStylesBeforeElement } from '@cypress/mount-utils'
import { ProxyComponent } from './proxy.component'

let config: CypressAngularConfig = {
  detectChanges: true,
  log: false,
}

export function setConfig(c: CypressAngularConfig): void {
  config = c
}

function init<T>(
  component: Type<T> | (Partial<TestModuleMetadata> & Partial<CypressAngularConfig>),
  options?: Partial<TestModuleMetadata> & Partial<CypressAngularConfig>
): void {
  Cypress.log({ displayName: 'Unit Test', message: ['Init Environment'] })

  TestBed.resetTestEnvironment()

  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting())

  const declarations = [ProxyComponent]
  const imports = []
  const providers = []
  const schemas = []

  if (component instanceof Type) {
    // @ts-ignore
    declarations.push(component)
  } else {
    if (component.declarations) {
      declarations.push(...component.declarations)
    }

    if (component.imports) {
      imports.push(...component.imports)
    }

    if (component.providers) {
      providers.push(...component.providers)
    }

    if (component.schemas) {
      schemas.push(...component.schemas)
    }
  }

  // automatic component change detection
  if (config.detectChanges) {
    providers.push({
      provide: ComponentFixtureAutoDetect,
      useValue: true,
    })
  }

  if (options) {
    config = { ...config, ...options }
    if (options.declarations) {
      declarations.push(...options.declarations)
    }

    if (options.providers) {
      providers.push(...options.providers)
    }

    if (options.imports) {
      imports.push(...options.imports)
    }

    if (options.schemas) {
      schemas.push(...options.schemas)
    }
  }

  TestBed.configureTestingModule({
    declarations,
    imports,
    providers,
    schemas,
  })

  // @ts-ignore
  const document: Document = cy.state('document')
  const el = document.getElementById('root')

  if (el === null) {
    throw new Error('root element not found')
  }

  injectStylesBeforeElement(config, document, el)
}

export function initEnv<T>(
  component: Type<T> | (Partial<TestModuleMetadata> & Partial<CypressAngularConfig>),
  options?: Partial<TestModuleMetadata> & Partial<CypressAngularConfig>
): void {
  init(component, options)
  TestBed.compileComponents()
}

export function mount<T>(component: Type<T>, inputs?: object): ComponentFixture<T> {
  // TODO improve logging using a full log instance
  Cypress.log({
    displayName: 'Unit Test',
    message: [`Mounting **${component.name}**`],
  })

  const fixture = TestBed.createComponent(component)
  let componentInstance = fixture.componentInstance

  componentInstance = Object.assign(componentInstance, inputs)
  if (config.detectChanges) {
    fixture.whenStable().then(() => fixture.detectChanges())
    fixture.detectChanges()
  }

  return fixture
}

export function initEnvHtml<T>(
  component: Type<T> | (Partial<TestModuleMetadata> & Partial<CypressAngularConfig>),
  options?: Partial<TestModuleMetadata> & Partial<CypressAngularConfig>
): void {
  init(component, options)
}

export function mountHtml(htmlTemplate: string): ComponentFixture<ProxyComponent> {
  Cypress.log({
    displayName: 'Unit Test',
    message: [`Mounting **${htmlTemplate}**`],
  })

  TestBed.overrideComponent(ProxyComponent, {
    set: { template: htmlTemplate },
  })

  TestBed.compileComponents()
  const fixture = TestBed.createComponent(ProxyComponent)

  if (config.detectChanges) {
    fixture.whenStable().then(() => fixture.detectChanges())
    fixture.detectChanges()
  }

  return fixture
}

export function getCypressTestBed(): TestBed {
  return getTestBed()
}
