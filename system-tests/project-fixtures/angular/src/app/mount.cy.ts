import { ParentChildModule } from "./components/parent-child.module";
import { ParentComponent } from "./components/parent.component";
import { CounterComponent } from "./components/counter.component";
import { CounterService } from "./components/counter.service";
import { ChildComponent } from "./components/child.component";
import { WithDirectivesComponent } from "./components/with-directives.component";
import { ButtonOutputComponent } from "./components/button-output.component";
import { createOutputSpy } from 'cypress/angular';
import { EventEmitter, Component } from '@angular/core';
import { ProjectionComponent } from "./components/projection.component";
import { LifecycleComponent } from "./components/lifecycle.component";
import { LogoComponent } from "./components/logo.component";

@Component({
  template: `<app-projection>Hello World</app-projection>`
})
class WrapperComponent {}

describe("angular mount", () => {
  it("pushes CommonModule into component", () => {
    cy.mount(WithDirectivesComponent);
    cy.get("ul").should("exist");
    cy.get("li").should("have.length", 3);

    cy.get("button").click();

    cy.get("ul").should("not.exist");
  });

  it("accepts imports", () => {
    cy.mount(ParentComponent, { imports: [ParentChildModule] });
    cy.contains("h1", "Hello World from ParentComponent");
  });

  it("accepts declarations", () => {
    cy.mount(ParentComponent, { declarations: [ChildComponent] });
    cy.contains("h1", "Hello World from ParentComponent");
  });

  it("accepts providers", () => {
    cy.mount(CounterComponent, { providers: [CounterService] });
    cy.contains("button", "Increment: 0").click().contains("Increment: 1");
  });

  it("detects changes", () => {
    cy.mount(ChildComponent, { componentProperties: { msg: "Hello World from Spec" } })
      .then(({ fixture }) =>
        cy.contains("h1", "Hello World from Spec").wrap(fixture)
      )
      .then((fixture) => {
        fixture.componentInstance.msg = "I just changed!";
        fixture.detectChanges();
        cy.contains("h1", "I just changed!");
      });
  });

  it('can bind the spy to the componentProperties bypassing types', () => {
    cy.mount(ButtonOutputComponent, {
      componentProperties: { 
        clicked: {
          emit: cy.spy().as('onClickedSpy')
        } as any
      }
    })
    cy.get('button').click()
    cy.get('@onClickedSpy').should('have.been.calledWith', true)
  })

  it('can bind the spy to the componentProperties bypassing types using template', () => {
    cy.mount('<app-button-output (clicked)="clicked.emit($event)"></app-button-output>', {
      declarations: [ButtonOutputComponent],
      componentProperties: { 
        clicked: {
          emit: cy.spy().as('onClickedSpy')
        } as any
      }
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
        login: cy.spy().as('myClickedSpy')
      }
    })
    cy.get('button').click()
    cy.get('@myClickedSpy').should('have.been.calledWith', true)
  })

  it('can spy on EventEmitter for mount using template', () => {
    cy.mount('<app-button-output (clicked)="handleClick.emit($event)"></app-button-output>', {
      declarations: [ButtonOutputComponent],
      componentProperties: {
        handleClick: new EventEmitter()
      }
    }).then(({ component }) => {
      cy.spy(component.handleClick, 'emit').as('handleClickSpy')
      cy.get('button').click()
      cy.get('@handleClickSpy').should('have.been.calledWith', true)
    })
  })

  it('can accept a createOutputSpy for an Output property', () => {
    cy.mount(ButtonOutputComponent, {
      componentProperties: {
        clicked: createOutputSpy<boolean>('mySpy')
      }
    })
    cy.get('button').click();
    cy.get('@mySpy').should('have.been.calledWith', true)
  })

  it('can accept a createOutputSpy for an Output property with a template', () => {
    cy.mount('<app-button-output (click)="clicked.emit($event)"></app-button-output>', {
      declarations: [ButtonOutputComponent],
      componentProperties: {
        clicked: createOutputSpy<boolean>('mySpy')
      }
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
        clicked: new EventEmitter()
      }
    })
    cy.get('button').click()
    cy.get('@clickedSpy').should('have.been.calledWith', true)
  })
  
  it('can handle content projection with a WrapperComponent', () => {
    cy.mount(WrapperComponent, {
      declarations: [ProjectionComponent]
    })
    cy.get('h3').contains('Hello World')
  })
  
  it('can handle content projection using template', () => {
    cy.mount('<app-projection>Hello World</app-projection>', {
      declarations: [ProjectionComponent]
    })
    cy.get('h3').contains('Hello World')
  })

  it('handles ngOnChanges on mount', () => {
    cy.mount(LifecycleComponent, {
      componentProperties: {
        name: 'Angular'
      }
    })

    cy.get('p').should('have.text', 'Hi Angular. ngOnInit fired: true and ngOnChanges fired: true and conditionalName: false')
  })

  it('handles ngOnChanges on mount with templates', () => {
    cy.mount('<app-lifecycle [name]="name"></app-lifecycle>', {
      declarations: [LifecycleComponent],
      componentProperties: {
        name: 'Angular'
      }
    })

    cy.get('p').should('have.text', 'Hi Angular. ngOnInit fired: true and ngOnChanges fired: true and conditionalName: false')
  })
  
  it('creates simpleChanges from componentProperties and calls ngOnChanges on Mount', () => {
    cy.mount(LifecycleComponent, {
      componentProperties: {
        name: 'CONDITIONAL NAME'
      }
    })
    cy.get('p').should('have.text', 'Hi CONDITIONAL NAME. ngOnInit fired: true and ngOnChanges fired: true and conditionalName: true')
  })

  it('creates simpleChanges from componentProperties and calls ngOnChanges on Mount with template', () => {
    cy.mount('<app-lifecycle [name]="name"></app-lifecycle>', {
      declarations: [LifecycleComponent],
      componentProperties: {
        name: 'CONDITIONAL NAME'
      }
    })
    cy.get('p').should('have.text', 'Hi CONDITIONAL NAME. ngOnInit fired: true and ngOnChanges fired: true and conditionalName: true')
  })

  it('ngOnChanges is not fired when no componentProperties given', () => {
    cy.mount(LifecycleComponent)
    cy.get('p').should('have.text', 'Hi . ngOnInit fired: true and ngOnChanges fired: false and conditionalName: false')
  })

  it('ngOnChanges is not fired when no componentProperties given with template', () => {
    cy.mount('<app-lifecycle></app-lifecycle>', {
      declarations: [LifecycleComponent]
    })
    cy.get('p').should('have.text', 'Hi . ngOnInit fired: true and ngOnChanges fired: false and conditionalName: false')
  })

  it('can load static assets', () => {
    cy.mount(LogoComponent)
    cy.get('img').should('be.visible').and('have.prop', 'naturalWidth').should('be.greaterThan', 0)
  })


  describe("teardown", () => {
    beforeEach(() => {
      cy.get("[id^=root]").should("not.exist");
    });

    it("should mount", () => {
      cy.mount(ButtonOutputComponent);
    });
  });
});
