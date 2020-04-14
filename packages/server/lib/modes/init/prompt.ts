import * as Scaffold from './scaffold'
import { Args, InitConfig } from './types'

export const prompt = async (args: Args) => {
  Scaffold.option.checkArgs(args)

  let options: InitConfig = {
    config: {},
  }

  if (!args.force) {
    options = await Scaffold.option.fromInquiry(args)
  }

  options = await Scaffold.option.fromCommandArgs(args, options)

  await Scaffold.create(args.cwd, options)
}
