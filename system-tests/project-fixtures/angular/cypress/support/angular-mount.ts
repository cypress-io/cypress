import { CommonModule } from "@angular/common";
import { Type } from "@angular/core";
import {
  ComponentFixture,
  getTestBed,
  TestBed,
  TestModuleMetadata,
} from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";

export interface TestBedConfig<T extends object> extends TestModuleMetadata {
  // this extends the normal angular TestBed config
  // and allows us to pass component Input() props as part of the config object
  inputs?: Partial<{ [P in keyof T]: T[P] }>;
}

export type MountResponse<T extends object> = {
  fixture: ComponentFixture<T>;
  testBed: TestBed;
  component: T;
};

export function bootstrapModule<T extends object>(
  component: Type<T>,
  config: TestBedConfig<T>
): TestBedConfig<T> {
  const { inputs, ...testModuleMetaData } = config;

  if (!testModuleMetaData.declarations) {
    testModuleMetaData.declarations = [];
  }

  if (!testModuleMetaData.imports) {
    testModuleMetaData.imports = [];
  }

  // We cannot push standalone components into declarations
  if (isStandaloneComponent(component)) {
    testModuleMetaData.imports.push(component);
  } else {
    testModuleMetaData.declarations.push(component);
  }

  if (!testModuleMetaData.imports.includes(CommonModule)) {
    testModuleMetaData.imports.push(CommonModule);
  }

  return testModuleMetaData;
}

function initTestBed<T extends object>(
  component: Type<T>,
  config: TestBedConfig<T>
): TestBed {
  const { providers, ...configRest } = config;

  const testBed: TestBed = getTestBed();

  testBed.resetTestEnvironment();

  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
    {
      teardown: { destroyAfterEach: false },
    } as any
  );

  testBed.configureTestingModule({
    ...bootstrapModule(component, configRest),
  });

  if (providers != null) {
    testBed.overrideComponent(component, {
      add: {
        providers,
      },
    });
  }

  return testBed;
}

export function setupFixture<T extends object>(
  component: Type<T>,
  testBed: TestBed,
  autoDetectChanges: boolean
): ComponentFixture<T> {
  const fixture = testBed.createComponent(component);

  fixture.whenStable().then(() => {
    fixture.autoDetectChanges(autoDetectChanges);
  });

  return fixture;
}

export function setupComponent<T extends object>(
  config: TestBedConfig<T>,
  fixture: ComponentFixture<T>
): T {
  let component: T = fixture.componentInstance;

  if (config?.inputs) {
    component = Object.assign(component, config.inputs);
  }

  return component;
}

function isStandaloneComponent(component: any): boolean {
  return component.ɵcmp.standalone;
}

export function mount<T extends object>(
  component: Type<T>,
  config: TestBedConfig<T> = {},
  autoDetectChanges = true
): Cypress.Chainable<MountResponse<T>> {
  const testBed: TestBed = initTestBed(component, config);

  const fixture = setupFixture(component, testBed, autoDetectChanges);

  return cy.wrap({
    fixture,
    testBed,
    component: setupComponent(config, fixture),
  });
}
