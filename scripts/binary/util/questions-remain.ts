import la from 'lazy-ass'
import is from 'check-more-types'

type Question = (currentValue: unknown) => Promise<unknown>

// Asks the question for each property the CLI options left unset, one at a
// time so interactive prompts don't overlap, and resolves with the options.
function askMissingOptions (propertiesToQuestions: Record<string, Question | undefined>) {
  la(is.object(propertiesToQuestions), 'expected object property:question')

  return async (options: Record<string, unknown> = {}) => {
    for (const [property, question] of Object.entries(propertiesToQuestions)) {
      if (is.has(options, property) || !is.fn(question)) {
        continue
      }

      options[property] = await question(options[property])
    }

    return options
  }
}

export default askMissingOptions
