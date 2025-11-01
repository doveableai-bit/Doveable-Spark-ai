import { FileNode } from '../types';

export interface DriveAccount {
  id: number;
  email: string;
  status: 'active' | 'full';
}

// Simulate a pool of 3 Google Drive accounts.
// In a real app, this would be managed via OAuth tokens.
const driveAccounts: DriveAccount[] = [
  { id: 1, email: 'account1@gmail.com', status: 'active' },
  { id: 2, email: 'account2@gmail.com', status: 'active' },
  { id: 3, email: 'account3@gmail.com', status: 'active' },
];

let saveCount = 0;

// This service simulates interactions with Google Drive.
export const googleDriveService = {
  
  // Simulates the OAuth connection flow.
  connect: async (): Promise<DriveAccount> => {
    console.log("Simulating Google Drive connection...");
    await new Promise(res => setTimeout(res, 1000)); // Fake network delay
    const firstActiveAccount = driveAccounts.find(acc => acc.status === 'active');
    if (!firstActiveAccount) {
        throw new Error("All Google Drive accounts are full.");
    }
    console.log("Connection successful.");
    return firstActiveAccount;
  },

  // Simulates saving project files to Google Drive with failover.
  saveProject: async (files: FileNode[]): Promise<{ message: string; account: DriveAccount }> => {
    console.log("Attempting to save project to Google Drive...");
    
    // To demonstrate the failover, let's make an account "full" after 2 saves.
    if (saveCount > 0 && saveCount % 2 === 0) {
        const firstActive = driveAccounts.find(a => a.status === 'active');
        if (firstActive) {
            console.log(`Simulating account ${firstActive.email} becoming full.`);
            firstActive.status = 'full';
        }
    }

    for (const account of driveAccounts) {
        if (account.status === 'active') {
            console.log(`Trying to save to ${account.email}...`);
            await new Promise(res => setTimeout(res, 1500)); // Fake upload delay
            
            const projectName = `project-${crypto.randomUUID().slice(0, 8)}`;
            console.log(`Project "${projectName}" saved successfully to ${account.email}.`);
            saveCount++;

            return {
                message: `Project saved as "${projectName}" in ${account.email}`,
                account: account,
            };
        } else {
            console.log(`Account ${account.email} is full, trying next account.`);
        }
    }

    throw new Error("All connected Google Drive accounts are full. Could not save project.");
  },
};
