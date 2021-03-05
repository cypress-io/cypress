import { Template } from './Template'
import { reactTemplates } from './react'
import { vueTemplates } from './vue'

const allTemplates = {
  react: reactTemplates,
  vue: vueTemplates,
}

export async function guessTemplate<T> (framework: keyof typeof allTemplates, cwd: string) {
  const templates = allTemplates[framework]

  for (const [name, template] of Object.entries(templates)) {
    const typedTemplate = template as Template<T>
    const { success, payload } = typedTemplate.test(cwd)

    if (success) {
      return {
        defaultTemplate: typedTemplate,
        defaultTemplateName: name,
        templatePayload: payload ?? null,
        possibleTemplates: templates,
      }
    }
  }

  return {
    templatePayload: null,
    defaultTemplate: null,
    defaultTemplateName: null,
    possibleTemplates: templates,
  }
}
