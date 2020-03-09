import * as Scaffold from './scaffold'

export const prompt = async (options) => {
  const scaffoldOption: any = options.force
    ? Scaffold.option.fromCommandArgs(options)
    : Scaffold.option.fromPrompts(options)

  await Scaffold.create(options.cwd, scaffoldOption)
}
