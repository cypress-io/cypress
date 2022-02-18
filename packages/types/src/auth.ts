export type AuthError = typeof authError[number]

export const authError = ['AUTH_COULD_NOT_LAUNCH_BROWSER', 'AUTH_ERROR_DURING_LOGIN', 'AUTH_BROWSER_LAUNCHED'] as const
