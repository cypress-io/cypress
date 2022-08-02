declare const example: {
  getPathToExamples(): Promise<string[]>;
  getPathToE2E(): string;
  getPathToPlugins(): string;
  getPathToTsConfig(): string;
  getPathToFixture(): string;
}

export default example;