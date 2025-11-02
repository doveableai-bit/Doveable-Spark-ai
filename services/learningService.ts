import { Learning } from '../types';

const LEARNINGS_STORAGE_KEY = 'doveable_ai_learnings';

// This is a mock database. In a real application, this would be a MongoDB collection.
// The MONGODB_URI provided would be used on the server-side.
const initialLearnings: Learning[] = [
    {
        id: '1',
        content: "When building a portfolio for a photographer, always include a prominent gallery section with high-resolution image placeholders and a clean, minimalist layout to emphasize the visuals.",
        createdAt: new Date()
    },
    {
        id: '2',
        content: "For e-commerce sites, the 'Add to Cart' button should be the most vibrant and eye-catching element on a product page to guide the user's action.",
        createdAt: new Date()
    }
];

const loadLearningsFromStorage = (): Learning[] => {
    try {
        const storedData = localStorage.getItem(LEARNINGS_STORAGE_KEY);
        if (storedData) {
            const parsed = JSON.parse(storedData);
            // Dates are stored as strings in JSON, so we need to convert them back
            return parsed.map((learning: any) => ({
                ...learning,
                createdAt: new Date(learning.createdAt),
            }));
        }
    } catch (error) {
        console.error("Failed to load learnings from local storage:", error);
    }
    // If nothing is in storage, return the initial default learnings
    return initialLearnings;
};

const saveLearningsToStorage = (learnings: Learning[]) => {
    try {
        localStorage.setItem(LEARNINGS_STORAGE_KEY, JSON.stringify(learnings));
    } catch (error) {
        console.error("Failed to save learnings to local storage:", error);
    }
};


let learningsDB: Learning[] = loadLearningsFromStorage();
// Ensure initial learnings are saved if storage was empty
if (localStorage.getItem(LEARNINGS_STORAGE_KEY) === null) {
    saveLearningsToStorage(learningsDB);
}


// This service simulates interactions with a backend learning database.
export const learningService = {
  
  getLearnings: async (): Promise<Learning[]> => {
    await new Promise(res => setTimeout(res, 100)); // Simulate network delay
    return [...learningsDB];
  },

  saveLearning: async (content: string): Promise<Learning> => {
    await new Promise(res => setTimeout(res, 200)); 
    const newLearning: Learning = {
        id: crypto.randomUUID(),
        content,
        createdAt: new Date()
    };
    learningsDB.push(newLearning);
    saveLearningsToStorage(learningsDB);
    return newLearning;
  },

  updateLearning: async (id: string, content: string): Promise<Learning | null> => {
    await new Promise(res => setTimeout(res, 200));
    const learningIndex = learningsDB.findIndex(l => l.id === id);
    if (learningIndex !== -1) {
      learningsDB[learningIndex].content = content;
      saveLearningsToStorage(learningsDB);
      return learningsDB[learningIndex];
    }
    return null;
  },

  deleteLearning: async (id: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 200));
    const initialLength = learningsDB.length;
    learningsDB = learningsDB.filter(l => l.id !== id);
    if (learningsDB.length < initialLength) {
      saveLearningsToStorage(learningsDB);
      return true;
    }
    return false;
  }
};