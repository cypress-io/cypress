import * as Scaffold from './scaffold'
import { Args } from './args'

export const prompt = async (args: Args) => {
  Scaffold.option.checkArgs(args)

  const scaffoldOption: any = args.force
    ? Scaffold.option.fromCommandArgs(args)
    : Scaffold.option.fromPrompts(args)

  await Scaffold.create(args.cwd, scaffoldOption)
}
