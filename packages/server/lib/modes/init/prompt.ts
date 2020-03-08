import * as Scaffold from './scaffold'

export const prompt = async (options) => {
  const scaffoldOption = options.force
    ? Scaffold.option.fromCommandArgs(options)
    : Scaffold.option.fromPrompts(options)

  Scaffold.create(scaffoldOption)
}
