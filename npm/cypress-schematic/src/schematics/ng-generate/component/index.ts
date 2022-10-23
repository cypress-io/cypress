import { chain, externalSchematic, noop, Rule, SchematicContext, Tree } from '@angular-devkit/schematics'
import cypressTest from '../cypress-test'
import path = require('path');

export default function (options: any): Rule {
  return (_: Tree, _context: SchematicContext) => {
    return chain([
      externalSchematic('@schematics/angular', 'component', {
        ...options,
        skipTests: true,
      }),
      (tree: Tree, _context: SchematicContext) => {
        const componentPath = tree.actions.filter((a) => a.path.includes(`${options.name}.component.ts`))
        .map((a) => path.dirname(a.path))
        .at(0)

        return componentPath ? cypressTest({
          ...options,
          component: true,
          path: componentPath,
        }) : noop()
      },
    ])
  }
}
