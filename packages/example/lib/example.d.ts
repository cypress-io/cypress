declare const example: {
  getPathToExamples(): Promise<string[]>;
  getPathToIntegration(): string;
  getPathToPlugins(): string;
  getPathToSupportFiles(): Promise<string[]>;
  getPathToTsConfig(): string;
  getPathToFixture(): string;
}

export default example;