import { TestBed } from '@angular/core/testing'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
      ],
    }).compileComponents()
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance

    expect(app).toBeTruthy()
  })

  it(`should have as title 'angular-cli-app'`, () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance

    expect(app.title).toEqual('angular-cli-app')
  })

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent)

    fixture.detectChanges()
    const compiled = fixture.nativeElement as HTMLElement

    expect(compiled.querySelector('.content span')?.textContent).toContain('angular-cli-app app is running!')
  })
})
