import { ParentChildModule } from './components/parent-child.module'
import { ParentComponent } from './components/parent.component'
import { CounterComponent } from './components/counter.component'
import { CounterService } from './components/counter.service'
import { ChildComponent } from './components/child.component'
import { WithDirectivesComponent } from './components/with-directives.component'
import { ButtonOutputComponent } from './components/button-output.component'
import { createOutputSpy } from 'cypress/angular'
import { EventEmitter, Component } from '@angular/core'
import { ProjectionComponent } from './components/projection.component'
import { ChildProvidersComponent } from './components/child-providers.component'
import { ParentProvidersComponent } from './components/parent-providers.component'
import { HttpClientModule } from '@angular/common/http'
import { of } from 'rxjs'
import { ChildProvidersService } from './components/child-providers.service'
import { AnotherChildProvidersComponent } from './components/another-child-providers.component'
import { TestBed } from '@angular/core/testing'
import { LifecycleComponent } from './components/lifecycle.component'
import { LogoComponent } from './components/logo.component'
import { TransientService, TransientServicesComponent } from './components/transient-services.component'
import { ComponentProviderComponent, MessageService } from './components/component-provider.component'
import { Cart, ProductComponent } from './components/cart.component'
import { UrlImageComponent } from './components/url-image.component'

@Component({
  standalone: false,
  template: `<app-projection>Hello World</app-projection>`,
})
class WrapperComponent {}

// Staring with Angular v19, standalone = true is the new default behavior.
// This means that the ng module configurations, including test module configurations,
// do not work by default with components. Cypress for non standalone components
// injects the CommonModule by default and allows users to add module declarations.
// unless standalone - false is configured for the component, this no longer works in Angular v19.
describe('angular mount', () => {
  it('pushes CommonModule into component', () => {
    cy.mount(WithDirectivesComponent)
    cy.get('ul').should('exist')
    cy.get('li').should('have.length', 3)

    cy.get('button').click()

    cy.get('ul').should('not.exist')
  })

  it('accepts imports', () => {
    cy.mount(ParentComponent, { imports: [ParentChildModule] })
    cy.contains('h1', 'Hello World from ParentComponent')
  })

  it('accepts declarations', () => {
    cy.mount(ParentComponent, {
      declarations: [ChildComponent],
    })

    cy.contains('h1', 'Hello World from ParentComponent')
  })

  it('accepts providers', () => {
    cy.mount(CounterComponent, { providers: [CounterService] })
    cy.contains('button', 'Increment: 0').click().contains('Increment: 1')
  })

  it('detects changes', () => {
    cy.mount(ChildComponent, { componentProperties: { msg: 'Hello World from Spec' } })
    .then(({ fixture }) => {
      return cy.contains('h1', 'Hello World from Spec').wrap(fixture)
    })
    .then((fixture) => {
      fixture.componentInstance.msg = 'I just changed!'
      fixture.detectChanges()
      cy.contains('h1', 'I just changed!')
    })
  })

  it('can bind the spy to the componentProperties bypassing types', () => {
    cy.mount(ButtonOutputComponent, {
      componentProperties: {
        clicked: {
          emit: cy.spy().as('onClickedSpy'),
        } as any,
      },
    })

    cy.get('button').click()
    cy.get('@onClickedSpy').should('have.been.calledWith', true)
  })

  it('can bind the spy to the componentProperties bypassing types using template', () => {
    cy.mount('<app-button-output (clicked)="clicked.emit($event)"></app-button-output>', {
      declarations: [ButtonOutputComponent],
      componentProperties: {
        clicked: {
          emit: cy.spy().as('onClickedSpy'),
        } as any,
      },
    })

    cy.get('button').click()
    cy.get('@onClickedSpy').should('have.been.calledWith', true)
  })

  it('can spy on EventEmitters', () => {
    cy.mount(ButtonOutputComponent).then(({ component }) => {
      cy.spy(component.clicked, 'emit').as('mySpy')
      cy.get('button').click()
      cy.get('@mySpy').should('have.been.calledWith', true)
    })
  })

  it('can use a template string instead of Type<T> for component', () => {
    cy.mount('<app-button-output (clicked)="login($event)"></app-button-output>', {
      declarations: [ButtonOutputComponent],
      componentProperties: {
        login: cy.spy().as('myClickedSpy'),
      },
    })

    cy.get('button').click()
    cy.get('@myClickedSpy').should('have.been.calledWith', true)
  })

  it('can spy on EventEmitter for mount using template', () => {
    cy.mount('<app-button-output (clicked)="handleClick.emit($event)"></app-button-output>', {
      declarations: [ButtonOutputComponent],
      componentProperties: {
        handleClick: new EventEmitter(),
      },
    }).then(({ component }) => {
      cy.spy(component.handleClick, 'emit').as('handleClickSpy')
      cy.get('button').click()
      cy.get('@handleClickSpy').should('have.been.calledWith', true)
    })
  })

  it('can accept a createOutputSpy for an Output property', () => {
    cy.mount(ButtonOutputComponent, {
      componentProperties: {
        clicked: createOutputSpy<boolean>('mySpy'),
      },
    })

    cy.get('button').click()
    cy.get('@mySpy').should('have.been.calledWith', true)
  })

  it('can accept a createOutputSpy for an Output property with a template', () => {
    cy.mount('<app-button-output (click)="clicked.emit($event)"></app-button-output>', {
      declarations: [ButtonOutputComponent],
      componentProperties: {
        clicked: createOutputSpy<boolean>('mySpy'),
      },
    })

    cy.get('button').click()
    cy.get('@mySpy').should('have.been.called')
  })

  it('can reference the autoSpyOutput alias on component @Outputs()', () => {
    cy.mount(ButtonOutputComponent, {
      autoSpyOutputs: true,
    })

    cy.get('button').click()
    cy.get('@clickedSpy').should('have.been.calledWith', true)
  })

  it('can reference the autoSpyOutput alias on component @Outputs() with a template', () => {
    cy.mount('<app-button-output (clicked)="clicked.emit($event)"></app-button-output>', {
      declarations: [ButtonOutputComponent],
      autoSpyOutputs: true,
      componentProperties: {
        clicked: new EventEmitter(),
      },
    })

    cy.get('button').click()
    cy.get('@clickedSpy').should('have.been.calledWith', true)
  })

  it('can handle content projection with a WrapperComponent', () => {
    cy.mount(WrapperComponent, {
      declarations: [ProjectionComponent],
    })

    cy.get('h3').contains('Hello World')
  })

  it('can handle content projection using template', () => {
    cy.mount('<app-projection>Hello World</app-projection>', {
      declarations: [ProjectionComponent],
    })

    cy.get('h3').contains('Hello World')
  })

  it('can use cy.intercept', () => {
    cy.intercept('GET', '**/api/message', {
      statusCode: 200,
      body: { message: 'test' },
    })

    cy.mount(ChildProvidersComponent, {
      imports: [HttpClientModule],
      providers: [ChildProvidersService],
    })

    cy.get('button').contains('default message')
    cy.get('button').click()
    cy.get('button').contains('test')
  })

  it('can use cy.intercept on child component', () => {
    cy.intercept('GET', '**/api/message', {
      statusCode: 200,
      body: { message: 'test' },
    })

    cy.mount(ParentProvidersComponent, {
      declarations: [ChildProvidersComponent, AnotherChildProvidersComponent],
      imports: [HttpClientModule],
      providers: [ChildProvidersService],
    })

    cy.get('button').contains('default message').click()
    cy.get('button').contains('test')
  })

  it('can make test doubles for child components', () => {
    cy.mount(ParentProvidersComponent, {
      declarations: [ChildProvidersComponent, AnotherChildProvidersComponent],
      imports: [HttpClientModule],
      providers: [
        {
          provide: ChildProvidersService,
          useValue: {
            getMessage () {
              return of('test')
            },
          } as ChildProvidersService,
        },
      ],
    })

    cy.get('button').contains('default message').click()
    cy.get('button').contains('test')
  })

  it('can use intercept with component with a provider override', () => {
    cy.intercept('GET', '**/api/message', {
      statusCode: 200,
      body: {
        message: 'test',
      },
    })

    cy.mount(AnotherChildProvidersComponent, {
      imports: [HttpClientModule],
      providers: [ChildProvidersService],
    })

    cy.get('button').contains('default another child message').click()
    cy.get('button').contains('test')
  })

  it('can use a test double for a component with a provider override', () => {
    cy.mount(AnotherChildProvidersComponent, { imports: [HttpClientModule] })
    TestBed.overrideComponent(AnotherChildProvidersComponent, { add: { providers: [{
      provide: ChildProvidersService,
      useValue: {
        getMessage () {
          return of('test')
        },
      },
    }] } })

    cy.get('button').contains('default another child message').click()
    cy.get('button').contains('test')
  })

  it('can use intercept with child component with a provider override', () => {
    cy.intercept('GET', '**/api/message', {
      statusCode: 200,
      body: {
        message: 'test',
      },
    })

    cy.mount(ParentProvidersComponent, {
      declarations: [ChildProvidersComponent, AnotherChildProvidersComponent],
      imports: [HttpClientModule],
      providers: [ChildProvidersService],
    })

    cy.get('button').contains('default another child message').click()
    cy.get('button').contains('test')
  })

  it('can use a test double for a child component with a provider override', () => {
    TestBed.overrideProvider(ChildProvidersService, {
      useValue: {
        getMessage () {
          return of('test')
        },
      } as ChildProvidersService,
    })

    cy.mount(ParentProvidersComponent, {
      declarations: [ChildProvidersComponent, AnotherChildProvidersComponent],
      imports: [HttpClientModule],
    })

    cy.get('button').contains('default another child message').click()
    cy.get('button').contains('test')
  })

  it('handles ngOnChanges on mount', () => {
    cy.mount(LifecycleComponent, {
      componentProperties: {
        name: 'Angular',
      },
    })

    cy.get('p').should('have.text', 'Hi Angular. ngOnInit fired: true and ngOnChanges fired: true and conditionalName: false')
  })

  it('handles ngOnChanges on mount with templates', () => {
    cy.mount('<app-lifecycle [name]="name"></app-lifecycle>', {
      declarations: [LifecycleComponent],
      componentProperties: {
        name: 'Angular',
      },
    })

    cy.get('p').should('have.text', 'Hi Angular. ngOnInit fired: true and ngOnChanges fired: true and conditionalName: false')
  })

  it('creates simpleChanges from componentProperties and calls ngOnChanges on Mount', () => {
    cy.mount(LifecycleComponent, {
      componentProperties: {
        name: 'CONDITIONAL NAME',
      },
    })

    cy.get('p').should('have.text', 'Hi CONDITIONAL NAME. ngOnInit fired: true and ngOnChanges fired: true and conditionalName: true')
  })

  it('creates simpleChanges from componentProperties and calls ngOnChanges on Mount with template', () => {
    cy.mount('<app-lifecycle [name]="name"></app-lifecycle>', {
      declarations: [LifecycleComponent],
      componentProperties: {
        name: 'CONDITIONAL NAME',
      },
    })

    cy.get('p').should('have.text', 'Hi CONDITIONAL NAME. ngOnInit fired: true and ngOnChanges fired: true and conditionalName: true')
  })

  it('ngOnChanges is not fired when no componentProperties given', () => {
    cy.mount(LifecycleComponent)
    cy.get('p').should('have.text', 'Hi . ngOnInit fired: true and ngOnChanges fired: false and conditionalName: false')
  })

  it('ngOnChanges is not fired when no componentProperties given with template', () => {
    cy.mount('<app-lifecycle></app-lifecycle>', {
      declarations: [LifecycleComponent],
    })

    cy.get('p').should('have.text', 'Hi . ngOnInit fired: true and ngOnChanges fired: false and conditionalName: false')
  })

  context('assets', () => {
    it('can load static assets from <img src="..." />', () => {
      cy.mount(LogoComponent)
      cy.get('img').should('be.visible').and('have.prop', 'naturalWidth').should('be.greaterThan', 0)
    })

    it('can load root relative scss "url()" assets', () => {
      cy.mount(UrlImageComponent)
      cy.get('.test-img')
      .invoke('css', 'background-image')
      .then((img) => {
        expect(img).to.contain('__cypress/src/test.png')
      })
    })
  })

  context('dependency injection', () => {
    it('should not override transient service', () => {
      cy.mount(TransientServicesComponent)
      cy.get('p').should('have.text', 'Original Transient Service')
    })

    it('should override transient service', () => {
      cy.mount(TransientServicesComponent, { providers: [{ provide: TransientService, useValue: { message: 'Overridden Transient Service' } }] })
      cy.get('p').should('have.text', 'Overridden Transient Service')
    })

    it('should have a component provider', () => {
      cy.mount(ComponentProviderComponent)
      cy.get('p').should('have.text', 'component provided service')
    })

    it('should not override component-providers via providers', () => {
      cy.mount(ComponentProviderComponent, { providers: [{ provide: MessageService, useValue: { message: 'overridden service' } }] })
      cy.get('p').should('have.text', 'component provided service')
    })

    it('should override component-providers via TestBed.overrideComponent', () => {
      TestBed.overrideComponent(ComponentProviderComponent, { set: { providers: [{ provide: MessageService, useValue: { message: 'overridden service' } }] } })
      cy.mount(ComponentProviderComponent)
      cy.get('p').should('have.text', 'overridden service')
    })

    it('should remove component-providers', () => {
      TestBed.overrideComponent(ComponentProviderComponent, { set: { providers: [] } })
      cy.mount(ComponentProviderComponent)
      cy.get('p').should('have.text', 'globally provided service')
    })

    it('should use TestBed.inject', () => {
      cy.mount(ProductComponent)
      cy.get('[data-testid=btn-buy]').click().then(() => {
        const cart = TestBed.inject(Cart)

        expect(cart.getItems()).to.have.length(1)
      })
    })

    it('should verify a faked service', () => {
      const cartFake = {
        items: [] as string[],
        add (product: string) {
          this.items.push(product)
        },
        getItems () {
          return this.items
        },
      }

      cy.mount(ProductComponent, { providers: [{ provider: Cart, useValue: cartFake }] })

      cy.get('[data-testid=btn-buy]').click().then(() => {
        const cart = TestBed.inject(Cart)

        expect(cart.getItems()).to.have.length(1)
      })
    })
  })

  describe('teardown', () => {
    const cyRootSelector = '[data-cy-root]'

    beforeEach(() => {
      cy.get(cyRootSelector).should('be.empty')
    })

    it('should mount', () => {
      cy.mount(ButtonOutputComponent)
      cy.get(cyRootSelector).should('not.be.empty')
    })

    it('should remove previous mounted component', () => {
      cy.mount(ChildComponent, { componentProperties: { msg: 'Render 1' } })
      cy.contains('Render 1')
      cy.mount(ChildComponent, { componentProperties: { msg: 'Render 2' } })
      cy.contains('Render 2')

      cy.contains('Render 1').should('not.exist')
      cy.get(cyRootSelector).children().should('have.length', 1)
    })
  })

  it('should error when passing in undecorated component', () => {
    Cypress.on('fail', (err) => {
      expect(err.message).contain('Please add a @Pipe/@Directive/@Component')

      return false
    })

    class MyClass {}

    cy.mount(MyClass)
  })
})

context('component-index.html', () => {
  before(() => {
    const cyRootSelector = '[data-cy-root]'
    const cyRoot = document.querySelector(cyRootSelector)!

    expect(cyRoot.parentElement === document.body)
    document.body.innerHTML = `
      <div id="container">
        <div data-cy-root></div>
      </div>
    `
  })

  it('preserves html hierarchy', () => {
    const cyRootSelector = '[data-cy-root]'

    cy.mount(ChildComponent, { componentProperties: { msg: 'Render 1' } })
    cy.contains('Render 1')
    cy.get(cyRootSelector).should('exist').parent().should('have.id', 'container')
    cy.get('#container').should('exist').parent().should('have.prop', 'tagName').should('eq', 'BODY')

    // structure persists after teardown
    cy.mount(ChildComponent, { componentProperties: { msg: 'Render 2' } })
    cy.contains('Render 2')
    cy.get(cyRootSelector).should('exist').parent().should('have.id', 'container')
    cy.get('#container').should('exist').parent().should('have.prop', 'tagName').should('eq', 'BODY')
  })
})
