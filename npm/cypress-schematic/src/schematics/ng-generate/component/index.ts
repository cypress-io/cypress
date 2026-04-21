import { chain, externalSchematic, noop, Rule, SchematicContext, Tree } from '@angular-devkit/schematics'
import cypressTest from '../cypress-test'
import { dirname, parse } from 'path'

export default function (options: any): Rule {
  return (_: Tree, _context: SchematicContext) => {
    return chain([
      externalSchematic('@schematics/angular', 'component', {
        ...options,
        skipTests: true,
      }),
      (tree: Tree, _context: SchematicContext) => {
        const componentName = parse(options.name).name
        const componentPath = tree.actions.filter((a) => a.path.includes(`${componentName}.component.ts`))
        .map((a) => dirname(a.path))[0]

        return componentPath ? cypressTest({
          ...options,
          component: true,
          path: componentPath,
          name: componentName,
        }) : noop()
      },
    ])
  }
}
