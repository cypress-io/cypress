import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
}
