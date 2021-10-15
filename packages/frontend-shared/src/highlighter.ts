import { Highlighter, getHighlighter, setOnigasmWASM, setCDN } from 'shiki'
import onigasm from 'onigasm/lib/onigasm.wasm?url'

setOnigasmWASM(onigasm)
setCDN('/shiki/')

export let highlighter: Highlighter

export async function initHighlighter () {
  if (highlighter) {
    return
  }

  highlighter = await getHighlighter({
    themes: ['cypress'],
    langs: ['typescript', 'javascript', 'css', 'json'],
  })
}
