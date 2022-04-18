declare const example: {
  getPathToExamples(): Promise<string[]>;
  getPathToE2E(): string;
  getPathToE2ETSRequiredFiles(): string;
  getPathToPlugins(): string;
  getPathToTsConfig(): string;
  getPathToFixture(): string;
}

export default example;