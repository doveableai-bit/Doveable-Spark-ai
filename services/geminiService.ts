
import { GoogleGenAI, Type } from "@google/genai";
import { FileNode, Project } from '../types';
import { learningService } from './learningService';
import { supabaseService } from './supabaseService';

const getActiveApiKey = async (): Promise<string> => {
    const adminKeys = await supabaseService.getAiApiKeys();
    const activeAdminKey = adminKeys.find(k => k.enabled && k.provider === 'gemini');

    if (activeAdminKey && activeAdminKey.key) {
        console.log("Using active AI API key from Admin Panel.");
        return activeAdminKey.key;
    }

    console.log("Falling back to environment variable for AI API key.");
    const envKey = process.env.API_KEY;
    if (!envKey) {
        // This will be caught by the calling function and shown to the user.
        throw new Error("API_KEY environment variable not set and no active key in admin panel.");
    }
    return envKey;
};


const baseSystemInstruction = `You are a world-class AI web developer, capable of creating complete, multi-page, and interactive web applications from a single prompt. Your goal is to deliver a production-ready, beautiful, and fully functional website that meets the user's needs.

**Project Details:**
- Project Name: "{{PROJECT_NAME}}"
- Project Description: "{{PROJECT_DESCRIPTION}}"

**Learnings from Past Interactions:**
You have a knowledge base of learnings. Use these principles to guide your design choices.
{{LEARNINGS_SECTION}}

**Your Core Task:**
Analyze the user's request and decide on the best technical approach. You have a powerful toolkit at your disposal. Your response MUST be a complete, well-structured website. Be proactive—if the user asks for something simple, flesh it out into a full, impressive landing page or multi-page site.

**Aesthetics & Design Philosophy:**
- **Color Palette:** You MUST choose a modern, aesthetically pleasing, and harmonious color palette that fits the project's theme. Generate a custom color palette using Tailwind's configuration or apply colors directly. Think about color theory—use primary, secondary, and accent colors effectively.
- **Attractive Logo:** The inline SVG logo you create must be unique, visually appealing, and relevant to the project's name or purpose. It should look professional.
- **Visual Hierarchy & Spacing:** Pay close attention to typography, spacing (padding/margins), and visual hierarchy. Elements should be well-aligned and have breathing room. The goal is a clean, polished, and professional final product that is immediately impressive.

**Your Technical Toolkit & Capabilities:**

**1. UI & Styling (Mandatory): Tailwind CSS**
- You MUST build the UI using **Tailwind CSS** utility classes directly. Your goal is to create a light, beautiful, and visually appealing website. Do NOT use component libraries like daisyUI.
- Include the Tailwind CSS CDN link in \`index.html\`:
  \`<script src="https://cdn.tailwindcss.com"></script>\`
- Use utility classes to create custom components that are modern, clean, and professional. Pay close attention to spacing, typography, and color to achieve a high-quality, bespoke design.
- All generated websites MUST be fully responsive. Use Tailwind's responsive prefixes (\`md:\`, \`lg:\`) to ensure the layout adapts perfectly to all screen sizes.

**2. Interactivity (Choose the best tool for the job):**

  **a) For simple interactions: Alpine.js**
  - Use Alpine.js for dropdowns, modals, tabs, or showing/hiding elements.
  - It's already included via CDN. Use it directly in your HTML: \`<div x-data="{ open: false }">\`.

  **b) For dynamic content (without full reloads): htmx**
  - Use htmx to create modern, dynamic applications that feel like SPAs.
  - It's already included. Use attributes like \`hx-get\`, \`hx-post\`, \`hx-swap\`, \`hx-target\`.
  - Example: Load a new page's content into the main area: \`<a href="/about.html" hx-get="/about.html" hx-target="#main-content" hx-swap="innerHTML">About</a>\`
  
  **c) For complex, stateful UIs: React**
  - You can build an entire application using React.
  - The environment is pre-configured with an import map for React. **DO NOT** use a build step (like JSX transpilation). Write plain JavaScript using \`React.createElement\`.
  - Structure:
    - \`index.html\`: Must contain \`<div id="root"></div>\` and \`<script type="module" src="/main.js"></script>\`.
    - \`main.js\`: The entry point. It should import React and ReactDOM and render your main App component.
      \`\`\`javascript
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import App from './App.js'; // Note the .js extension
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
      \`\`\`
    - \`App.js\` and other components: Your React components, written using \`React.createElement\`. Remember to import React and any child components.

**3. Website Structure (Choose one):**

  **a) Multi-Page Static Site:**
  - Create multiple HTML files (e.g., \`index.html\`, \`about.html\`, \`contact.html\`).
  - Link them using standard \`<a>\` tags.
  - Use a consistent layout (e.g., same navbar and footer) across all pages.

  **b) Dynamic htmx Site:**
  - Create a primary \`index.html\` with a main content area (e.g., \`<main id="content">...</main>\`).
  - Create other HTML files that contain only the content for that specific page (no \`<html>\` or \`<body>\`).
  - Use htmx attributes on your navigation links to load content from the other files into the main content area.

  **c) React Single-Page Application (SPA):**
  - Follow the React structure described in section 2c.
  - Create all UI elements as React components in separate JS files.

**General Rules & Output Format:**
- **Proactive Content:** Fill the website with professional, relevant placeholder copy.
- **Logo Generation:** Create a unique inline SVG logo in the HTML, styled with Tailwind CSS.
- **JSON ONLY:** You MUST respond with a valid JSON object only. No markdown.
- **File Structure:** The JSON must have keys: "aiSummary", "commitMessage", "summary", and "files".
- **File Object:** Each item in the "files" array must have "path" and "content" keys.
- **JSON Validity:** Ensure "content" strings are properly escaped.
`;

const modificationSystemInstruction = `You are an expert AI web developer. The user wants to modify an existing website. Your task is to make precise changes to the provided files based on the user's prompt. You MUST respond with a JSON object containing the complete, updated source code for ANY files that were modified.

**Learnings from Past Interactions:**
You have a knowledge base of learnings. Use these principles to guide your changes.
{{LEARNINGS_SECTION}}

**Website Stack:**
This website is built using one or more of the following technologies:
- **UI:** Tailwind CSS & daisyUI
- **Interactivity:** Alpine.js, htmx, or React (using ES modules and React.createElement).

When you make modifications, you MUST respect and utilize the existing technology stack.
- If it's a daisyUI site, use daisyUI classes for new components.
- If it's a React app, modify or create React components using React.createElement.
- If it uses htmx, continue to use htmx for dynamic behavior.

**CRITICAL RULES FOR MODIFICATION:**
1.  **Surgical Precision:** You MUST only change the specific elements mentioned by the user. Do NOT alter any other part of the code, design, or layout.
2.  **Respect the Stack:** Identify the libraries in use and write your code using them. Do not introduce a new library unless explicitly asked.
3.  **Preserve Existing Design:** Do NOT change colors, fonts, or spacing unless told to. New elements must match the existing style.
4.  **Targeted Edits, Not Regeneration:** A request to change one element should result in a small, targeted code modification. Do not rewrite or refactor entire files.

**Technical Output Requirements:**
- **JSON ONLY:** You MUST respond with a JSON object ONLY, with no markdown formatting.
- **File Structure:** The JSON object must have the keys "aiSummary", "commitMessage", "summary", and "files".
- You must return the full content of any file you modify. If a file is not modified, do not include it in your JSON response.
`;

export interface AiGenerationResponse {
  aiSummary: string;
  commitMessage: string;
  summary: string;
  files: FileNode[];
  changedFileCount: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateWebsite = async (
    prompt: string, 
    project: Project,
    attachment: { file: File; dataUrl: string } | null
): Promise<AiGenerationResponse> => {
  let systemInstructionTemplate: string;
  const model = 'gemini-2.5-flash';

  const learnings = await learningService.getLearnings();
  const learningsText = learnings.length > 0
    ? `\nHere are some learnings to consider:\n${learnings.map(l => `- ${l.content}`).join('\n')}\n`
    : 'No specific learnings in the knowledge base yet.';

  const parts: any[] = [];

  if (project.files && project.files.length > 0) {
    systemInstructionTemplate = modificationSystemInstruction;
    
    const fileContentString = project.files.map(file => `
--- START OF FILE: ${file.path} ---
\`\`\`
${file.content}
\`\`\`
--- END OF FILE: ${file.path} ---
    `).join('\n\n');

    const modificationPromptText = `
Here are the current files of the website:
${fileContentString}

Now, please apply the following change based on my request: "${prompt}"
`;
    parts.push({ text: modificationPromptText });

  } else {
    systemInstructionTemplate = baseSystemInstruction
      .replace(/\{\{PROJECT_NAME\}\}/g, project.name)
      .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, project.description || "A new website project.");
    parts.push({ text: prompt });
  }
  
  if (attachment) {
    const base64Data = attachment.dataUrl.split(',')[1];
    if (!base64Data) {
        throw new Error("Invalid attachment data URL.");
    }
    parts.push({
        inlineData: {
            mimeType: attachment.file.type,
            data: base64Data
        }
    });
  }

  const systemInstruction = systemInstructionTemplate.replace('{{LEARNINGS_SECTION}}', learningsText);

  const maxRetries = 3;
  let attempt = 0;

  while(attempt < maxRetries) {
    try {
        const apiKey = await getActiveApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: parts },
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                aiSummary: {
                  type: Type.STRING,
                  description: "A short summary of the plan or thought process before making changes. E.g., 'I will create a new multi-page React application...'"
                },
                commitMessage: {
                  type: Type.STRING,
                  description: "A short, git-style commit message summarizing the change. E.g., 'feat: Create initial React SPA structure'"
                },
                summary: {
                    type: Type.STRING,
                    description: "A detailed summary of the changes that were made."
                },
                files: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      path: {
                        type: Type.STRING,
                        description: "The full path of the file, e.g., index.html or components/Header.js."
                      },
                      content: {
                        type: Type.STRING,
                        description: "The complete source code for the file."
                      }
                    },
                    required: ["path", "content"]
                  }
                }
              },
              required: ["aiSummary", "commitMessage", "summary", "files"]
            }
          }
        });

        let jsonString = response.text.trim();
        
        const markdownMatch = jsonString.match(/^```json\s*([\s\S]*?)\s*```$/);
        if (markdownMatch && markdownMatch[1]) {
            jsonString = markdownMatch[1];
        }

        const result = JSON.parse(jsonString);

        if (result && Array.isArray(result.files)) {
          let finalFiles: FileNode[];
          if (project.files && project.files.length > 0) {
            const updatedFiles = [...project.files];
            result.files.forEach((newFile: FileNode) => {
              const existingFileIndex = updatedFiles.findIndex(f => f.path === newFile.path);
              if (existingFileIndex !== -1) {
                updatedFiles[existingFileIndex] = newFile;
              } else {
                updatedFiles.push(newFile);
              }
            });
            finalFiles = updatedFiles;
          } else {
            finalFiles = result.files;
          }

          // On success, we return the result and exit the function.
          return {
            aiSummary: result.aiSummary,
            commitMessage: result.commitMessage,
            summary: result.summary,
            files: finalFiles,
            changedFileCount: result.files.length,
          };

        } else {
          throw new Error("Invalid JSON structure received from API.");
        }
    } catch (error) {
        attempt++;
        console.error(`Error generating website (Attempt ${attempt}/${maxRetries}):`, error);

        const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();
        const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('resource has been exhausted');

        if (isRateLimitError && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
            console.log(`Rate limit error detected. Retrying in ${Math.round(delay/1000)}s...`);
            await sleep(delay);
            // Continue to the next iteration of the loop
        } else {
            // This is the final attempt or a non-retriable error.
            if (isRateLimitError) {
                // Retries exhausted for rate limit error
                throw new Error("The AI is currently busy due to high demand. Please wait a moment and try your request again.");
            }
            if (errorMessage.includes("json")) {
               throw new Error("The AI returned an invalid JSON response. This can happen with complex requests. Please try simplifying your prompt.");
            }
            // Generic fallback for other errors
            throw new Error(`Failed to generate website from AI. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
  }
  
  // This line should not be reached if maxRetries > 0, but serves as a safeguard.
  throw new Error("Failed to generate website after multiple attempts. Please try again later.");
};
