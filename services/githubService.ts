import { FileNode } from '../types';

// This is a mock service. In a real application, you would use a library like Octokit.
export const githubService = {
  connect: async (details: { token: string; projectName: string }): Promise<{ repoUrl: string }> => {
    console.log('Mock connecting to GitHub with token and project name:', details.projectName);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!details.token) {
        throw new Error("GitHub Personal Access Token is required.");
    }
    
    // Simulate creating a new repo based on the project name
    const repoName = details.projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const repoUrl = `https://github.com/your-username/${repoName}`;
    console.log(`Mock GitHub connection successful. Created repo: ${repoUrl}`);
    return { repoUrl };
  },

  saveFiles: async (files: FileNode[], message: string): Promise<void> => {
    console.log(`Mock pushing ${files.length} files to GitHub with message: "${message}"`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock GitHub push successful.');
  }
};