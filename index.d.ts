import * as webpack from 'webpack';
import Cypress from 'cypress';

declare namespace CypressWebpackPreProcessor {
  export type Options = { webpackOptions: webpack.Configuration };
  export type FilePreprocessor = (file: Cypress.FileObject) => string | Promise<string>;
}

declare module "@cypress/webpack-preprocessor" {
  const _default: (options: CypressWebpackPreProcessor.Options) => CypressWebpackPreProcessor.FilePreprocessor;

  export = _default;
}
