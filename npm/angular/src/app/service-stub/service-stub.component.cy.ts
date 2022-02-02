import { getCypressTestBed, initEnv, mount } from '@cypress/angular'
import { of } from 'rxjs'
import { AppModule } from '../app.module'
import { MyValuesService } from '../my-values.service'
import { ServiceStubComponent } from './service-stub.component'

describe('ServiceStubComponent', () => {
  it('No stub', () => {
    initEnv(ServiceStubComponent, { providers: [MyValuesService] })
    mount(ServiceStubComponent)

    cy.contains('first : val1')
    cy.contains('second: val2Obs')
  })

  it('No stub with AppModule', () => {
    initEnv({ imports: [AppModule] })
    mount(ServiceStubComponent)

    cy.contains('first : val1')
    cy.contains('second: val2Obs')
  })

  it('Stub primitive', () => {
    initEnv(ServiceStubComponent, { providers: [MyValuesService] })

    const myValuesService = getCypressTestBed().inject(MyValuesService)

    cy.stub(myValuesService, 'getValues').returns(['val3', 'val4'])

    mount(ServiceStubComponent)

    cy.contains('first : val3')
    cy.contains('second: val2Obs')
  })

  it('Stub observable', () => {
    initEnv(ServiceStubComponent, { providers: [MyValuesService] })

    const myValuesService = getCypressTestBed().inject(MyValuesService)

    cy.stub(myValuesService, 'getValuesObservable').returns(
      of(['val3Obs', 'val4Obs']),
    )

    mount(ServiceStubComponent)
    cy.contains('first : val1')
    cy.contains('second: val4Obs')
  })
})
