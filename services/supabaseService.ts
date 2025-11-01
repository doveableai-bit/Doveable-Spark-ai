import { Project } from '../types';

// This is a mock service. In a real application, you would use the Supabase client library.
export const supabaseService = {
  connect: async (details: { url: string; anonKey: string }): Promise<void> => {
    console.log('Mock connecting to Supabase with:', details);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!details.url || !details.anonKey) {
        throw new Error("Supabase URL and Anon Key are required.");
    }
    console.log('Mock Supabase connection successful.');
  },

  saveProject: async (project: Project): Promise<void> => {
    console.log(`Mock saving project "${project.name}" to Supabase.`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock project save successful.');
  }
};
