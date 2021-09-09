declare const example: {
  getPathToExamples(): Promise<string[]>;
  getPathToPlugins(): string;
  getPathToSupportFiles(): Promise<string[]>;
  getPathToTsConfig(): string;
  getPathToFixture(): string;
}

export default example;