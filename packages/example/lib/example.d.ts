declare const example: {
  getPathToExamples(): Promise<{ fullPaths: string[] }>;
  getFolderName(): string;
  getPathToPlugins(): string;
  getPathToSupportFiles(): Promise<string[]>;
  getPathToTsConfig(): string;
}

export default example;