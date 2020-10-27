declare const example: {
  getPathToExamples(): Promise<{ fullPaths: string[] }>;
  getFolderName(): string;
  getPathToPlugins(): string;
  getPathToSupportFiles(): Promise<{ fullPaths: string[] }>;
}

export default example;