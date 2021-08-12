import { nxs } from 'nexus-decorators'
import { Project } from './Project'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class LocalProject extends Project {
}
