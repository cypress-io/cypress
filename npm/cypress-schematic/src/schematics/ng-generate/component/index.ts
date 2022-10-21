import { chain, externalSchematic, Rule, SchematicContext, Tree } from '@angular-devkit/schematics'
import cypressTest from '../cypress-test'
import path = require('path');

export default function (options: any): Rule {
  return (_: Tree, _context: SchematicContext) => {
    return chain([
      externalSchematic('@schematics/angular', 'component', options),
      (tree: Tree, _context: SchematicContext) => {
        return cypressTest({
          ...options,
          component: true,
          path: tree.actions.filter((a) => a.path.includes(`${options.name}.component.ts`))
          .map((a) => path.dirname(a.path))
          .at(0),
        })
      },
    ])
  }
}
