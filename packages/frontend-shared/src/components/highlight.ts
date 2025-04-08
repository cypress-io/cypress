import type { Highlighter, ILanguageRegistration } from 'shiki'
import { getHighlighter, setOnigasmWASM } from 'shiki'
import onigasm from 'onigasm/lib/onigasm.wasm?url'
import shikiCyTheme from '../public/shiki/themes/cypress.theme.json'
const langJSONFilesArray = import.meta.glob('../public/shiki/languages/*.tmLanguage.json', { eager: true })

// Convert to the format shiki needs for language customization.
// @see https://github.com/shikijs/shiki/blob/main/docs/languages.md
const langs: ILanguageRegistration[] = Object.values(langJSONFilesArray).map((grammar: any) => {
  return {
    grammar,
    id: grammar.name,
    scopeName: grammar.scopeName,
  }
})

setOnigasmWASM(onigasm)

let highlighter: Highlighter

export type CyLangType = 'typescript' | 'javascript' | 'ts' | 'js' | 'css' | 'jsx' | 'tsx' | 'json' | 'yaml' | 'html' | 'plaintext' | 'txt' | 'text' | 'vue' | string

export const langsSupported = langs.map((lang: ILanguageRegistration) => lang.id)

export async function initHighlighter () {
  if (highlighter) {
    return
  }

  highlighter = await getHighlighter({
    theme: shikiCyTheme as any,
    langs,
  })
}

const inheritAttrs = false

export { highlighter, inheritAttrs }
