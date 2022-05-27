import { getTestBed } from '@angular/core/testing'
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing'
import { MyValuesService } from './my-values.service'

describe('MyValuesService', () => {
  let service: MyValuesService

  before(() => {
    getTestBed().resetTestEnvironment()

    getTestBed().initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
    )

    getTestBed().configureTestingModule({
      providers: [{ provide: MyValuesService, useClass: MyValuesService }],
    })

    service = getTestBed().inject(MyValuesService)
  })

  it('All values are here', () => {
    expect(service.getValues().length).equals(2)
    expect(service.getValues()[0]).equals('val1')
    expect(service.getValues()[1]).equals('val2')
  })
})
