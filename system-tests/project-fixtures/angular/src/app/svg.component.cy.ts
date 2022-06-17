import { SvgComponent } from "./svg.component";
import { mount } from 'cypress-angular-component-testing'


it('should render', () => {
  mount(SvgComponent)
})