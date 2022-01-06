declare const example: {
  getPathToExamples(): Promise<string[]>;
  getPathToIntegration(): string;
  getPathToPlugins(): string;
  getPathToTsConfig(): string;
  getPathToFixture(): string;
}

export default example;