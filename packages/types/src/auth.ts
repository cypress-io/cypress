export type AuthStateName = typeof authStateName[number]

export const authStateName = ['AUTH_COULD_NOT_LAUNCH_BROWSER', 'AUTH_ERROR_DURING_LOGIN', 'AUTH_BROWSER_LAUNCHED'] as const
