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

  it(`should have as title 'sandbox13'`, () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance

    expect(app.title).toEqual('sandbox13')
  })

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent)

    fixture.detectChanges()
    const compiled = fixture.nativeElement as HTMLElement

    expect(compiled.querySelector('.content span')?.textContent).toContain('sandbox13 app is running!')
  })
})
