import { merge, clone } from 'lodash'

export type BurnInConfig = {
  default?: number | undefined
  enabled?: boolean | undefined
  flaky?: number | undefined
}

export type BurnInConfigInstructions = {
  overrides?: BurnInConfig
  values?: BurnInConfig
}

export type BurnInActionPayload = {
  config: BurnInConfigInstructions
  startingScore: 0 | 1 | -1 | -2 | null
  planType: string
}

export type BurnInAction = {
  clientId: string | null
  payload: BurnInActionPayload
}

export type UserFacingBurnInConfig = boolean | {
  default: number
  flaky: number
}

export class BurnInManager {
  private _actions: BurnInAction[] = []

  setActions (actions: BurnInAction[]) {
    this._actions = actions
  }

  getActionDetails (clientId: string | null) {
    if (!clientId) return null

    return this._actions.find((action) => action.clientId === clientId)?.payload ?? null
  }

  getActions () {
    return clone(this._actions)
  }
}

export function getBurnInConfig (burnInConfig: UserFacingBurnInConfig): BurnInConfig {
  return typeof burnInConfig === 'boolean' ? { enabled: burnInConfig } : { enabled: true, ...burnInConfig }
}

export function mergeBurnInConfig (
  layer1Config:
  | BurnInConfigInstructions
  | BurnInConfig,
  layer2Config:
  | BurnInConfigInstructions
  | BurnInConfig,
) {
  const layer1Overrides =
    'overrides' in layer1Config ? layer1Config.overrides ?? {} : {}
  const layer1Values =
    'values' in layer1Config ? layer1Config.values ?? {} : (layer1Config as BurnInConfig)

  const layer2Overrides =
    'overrides' in layer2Config ? layer2Config.overrides ?? {} : {}
  const layer2Values =
    'values' in layer2Config ? layer2Config.values ?? {} : (layer2Config as BurnInConfig)

  const overrides = merge(layer2Overrides, layer1Overrides) // precedence is given to layer1 overrides
  const combinedValues = merge(layer1Values, layer2Values) // precedence is given to layer2 values
  const result = merge(combinedValues, overrides) // precedence is given to overrides

  return result
}
