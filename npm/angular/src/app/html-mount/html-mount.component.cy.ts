import { initEnvHtml, mountHtml } from '@cypress/angular'
import { AppModule } from '../app.module'
import { HtmlMountComponent } from './html-mount.component'

describe('HtmlMountComponent', () => {
  it('mount work', () => {
    initEnvHtml({ declarations: [HtmlMountComponent] })
    const fixture = mountHtml('<app-html-mount></app-html-mount>')

    fixture.detectChanges()
    cy.contains('works !')
  })

  it('mount with input work', () => {
    initEnvHtml({ declarations: [HtmlMountComponent] })
    const fixture = mountHtml(
      `<app-html-mount [data]="'my input'"></app-html-mount>`,
    )

    fixture.detectChanges()
    cy.contains('works !')
    cy.contains('my input')
  })
})
