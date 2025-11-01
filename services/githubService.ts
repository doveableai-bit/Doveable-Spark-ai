import { FileNode } from '../types';

// This is a mock service. In a real application, you would use a library like Octokit.
export const githubService = {
  connect: async (details: { repoUrl: string }): Promise<void> => {
    console.log('Mock connecting to GitHub with:', details);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!details.repoUrl) {
        throw new Error("GitHub Repo URL is required.");
    }
    console.log('Mock GitHub connection successful.');
  },

  saveFiles: async (files: FileNode[], message: string): Promise<void> => {
    console.log(`Mock pushing ${files.length} files to GitHub with message: "${message}"`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock GitHub push successful.');
  }
};
