declare const example: {
  getPathToExamples(): Promise<string[]>;
  getFolderName(): string;
  getPathToPlugins(): string;
  getPathToSupportFiles(): Promise<string[]>;
  getPathToTsConfig(): string;
  getPathToFixture(): string;
}

export default example;