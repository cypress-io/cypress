import { TestBed } from '@angular/core/testing'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
    }).compileComponents()
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.debugElement.componentInstance

    expect(app).toBeTruthy()
  })

  it(`should have as title 'angular-project'`, () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.debugElement.componentInstance

    expect(app.title).toEqual('angular-project')
  })

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent)

    fixture.detectChanges()
    const compiled = fixture.debugElement.nativeElement

    expect(compiled.querySelector('.content span').textContent).toContain('angular-project app is running!')
  })
})
