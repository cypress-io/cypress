import * as Scaffold from './scaffold'
import { Args } from './types'

export const prompt = async (args: Args) => {
  Scaffold.option.checkArgs(args)

  const scaffoldOption: any = args.force
    ? await Scaffold.option.fromCommandArgs(args)
    : await Scaffold.option.fromInquiry(args.cwd, args)

  await Scaffold.create(args.cwd, scaffoldOption)
}
