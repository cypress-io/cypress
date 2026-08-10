export type AgentName =
  | 'auggie'
  | 'claude'
  | 'codex'
  | 'cursor'
  | 'devin'
  | 'gemini'
  | 'goose'
  | 'junie'
  | 'kiro'
  | 'opencode'
  | 'other'
  | 'pi'
  | 'replit'

type EnvCheck = string | ((env: NodeJS.ProcessEnv) => boolean)

const envMatcher = (key: string, regex: RegExp, opts: { noTTY?: boolean } = {}) => {
  return (env: NodeJS.ProcessEnv): boolean => {
    // Some vars are set by both an IDE's integrated terminal and its CLI agent. A TTY
    // means a human is typing at the terminal, not an agent-spawned subprocess.
    if (opts.noTTY && process.stdout?.isTTY) {
      return false
    }

    const value = env[key]

    return value ? regex.test(value) : false
  }
}

// IDEs are checked last so an agent running inside one is reported as the agent.
const AGENTS: readonly (readonly [AgentName, readonly EnvCheck[]])[] = [
  ['claude', ['CLAUDECODE', 'CLAUDE_CODE']],
  ['replit', ['REPL_ID']],
  ['gemini', ['GEMINI_CLI']],
  ['codex', ['CODEX_SANDBOX', 'CODEX_THREAD_ID']],
  ['opencode', ['OPENCODE']],
  ['pi', [envMatcher('PATH', /\.pi[\\/]agent/)]],
  ['auggie', ['AUGMENT_AGENT']],
  ['goose', ['GOOSE_PROVIDER']],
  ['junie', ['JUNIE_DATA', 'JUNIE_SHIM_PATH']],
  ['devin', [envMatcher('EDITOR', /devin/)]],
  ['cursor', ['CURSOR_AGENT']],
  ['kiro', [envMatcher('TERM_PROGRAM', /kiro/, { noTTY: true })]],
]

const KNOWN_NAMES = AGENTS.map(([name]) => name)

// AI_AGENT is free-form and often carries a version (Claude Code sets
// "claude-code_2-1-221_agent"), so narrow it to a known name instead of passing it
// along verbatim — callers report this value, and only fixed names may leave the machine.
const fromAiAgent = (value: string): AgentName => {
  const normalized = value.toLowerCase()

  return KNOWN_NAMES.find((name) => normalized.startsWith(name)) ?? 'other'
}

export const detectAgent = (env: NodeJS.ProcessEnv = process.env): AgentName | undefined => {
  for (const [name, checks] of AGENTS) {
    for (const check of checks) {
      if (typeof check === 'string' ? env[check] : check(env)) {
        return name
      }
    }
  }

  return env.AI_AGENT ? fromAiAgent(env.AI_AGENT) : undefined
}

export const isAgent = (env: NodeJS.ProcessEnv = process.env): boolean => {
  return !!detectAgent(env)
}
