import { GoogleGenAI, Type } from "@google/genai";
import { FileNode, Project } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

const baseSystemInstruction = `You are an expert web developer AI. The user will provide a prompt to create a website.

Here are the project details:
- Project Name: "{{PROJECT_NAME}}"
- Project Description: "{{PROJECT_DESCRIPTION}}"

Your task is to generate a complete, functional, and visually appealing website based on these details and the user's specific prompt.

**Key requirements:**

1.  **Content and Structure:**
    - The website's name is "{{PROJECT_NAME}}". Use this name prominently in the \`<title>\` tag, main \`<h1>\` headings, and other relevant places.
    - The website should be about "{{PROJECT_DESCRIPTION}}". Use this description to guide the structure, content, functionality, and overall theme of the site.
    - The generated website MUST be fully responsive.

2.  **Branding & Logo Generation:**
    - Act as a professional brand designer. Your goal is to create a visually attractive and memorable branding logo for "{{PROJECT_NAME}}".
    - The logo MUST be a unique SVG, directly inspired by the project's name and description. Avoid generic icons.
    - The logo should have a professional color palette that complements the overall theme of the website.
    - Embed the complete SVG code for the logo directly within the \`index.html\` file, typically in the header/navigation area.
    - Use Tailwind CSS classes to control the size of the logo (e.g., \`h-8 w-auto\` or similar).

3.  **Output Format:**
    - You MUST respond with a JSON object ONLY, with no markdown formatting or extra text.
    - The JSON object must have a single key "files" which is an array of objects.
    - Each object in the "files" array represents a file and MUST have two keys: "path" (e.g., "index.html", "css/style.css") and "content".
    - The "content" value must be the full source code for the file as a string. **Crucially, all characters within this string, such as double quotes ("), backslashes (\\), and newlines (\\n), MUST be properly escaped to create a valid JSON string.**

4.  **Technical Specifications:**
    - Always include an 'index.html' file.
    - For styling, use Tailwind CSS. You MUST include the Tailwind CSS CDN script (\`<script src="https://cdn.tailwindcss.com"></script>\`) in the \`<head>\` of the 'index.html' file.
    - If you create JavaScript files, link them in the 'index.html' with \`<script type="module" src="./js/script.js"></script>\` at the end of the \`<body>\`.
    - Ensure all file paths are relative and correct.`;

const modificationSystemInstruction = `You are an expert web developer AI. The user wants to modify an existing website. Your task is to make precise changes to the provided files based on the user's prompt. You MUST respond with a JSON object containing the complete, updated source code for ANY files that were modified.

**CRITICAL RULES FOR MODIFICATION:**
1.  **Surgical Precision:** You MUST only change the specific elements mentioned by the user. Do NOT alter any other part of the code, design, or layout.
2.  **Preserve Existing Design:**
    -   Do NOT change colors, backgrounds, fonts, spacing, or layout unless explicitly told to.
    -   When adding new elements, they MUST match the styling of existing similar elements.
3.  **Content-Only Swaps:** When asked to change text (e.g., a name or title), replace only the text content inside the HTML tags. The tags and their classes/styles MUST remain unchanged.
4.  **Targeted Edits, Not Regeneration:** A request to change one element should result in a small, targeted code modification. Do not rewrite or refactor entire files.
5.  **No Unrequested Changes:** Do not add, remove, or refactor any code, features, or files unless explicitly told to. Your goal is a minimal, targeted edit.

You must return the full content of any file you modify. If a file is not modified, do not include it in your JSON response.
`;


export const generateWebsite = async (prompt: string, project: Project): Promise<FileNode[]> => {
  let systemInstruction: string;
  let apiContents: string;

  if (project.files && project.files.length > 0) {
    // This is a modification request
    systemInstruction = modificationSystemInstruction;
    
    const fileContentString = project.files.map(file => `
--- START OF FILE: ${file.path} ---
\`\`\`
${file.content}
\`\`\`
--- END OF FILE: ${file.path} ---
    `).join('\n\n');

    apiContents = `
Here are the current files of the website:
${fileContentString}

Now, please apply the following change based on my request: "${prompt}"
`;

  } else {
    // This is a new website creation request
    systemInstruction = baseSystemInstruction
      .replace(/\{\{PROJECT_NAME\}\}/g, project.name)
      .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, project.description || "A new website project.");
    apiContents = prompt;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: apiContents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: {
                    type: Type.STRING,
                    description: "The full path of the file, e.g., index.html or css/styles.css."
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
          required: ["files"]
        }
      }
    });

    let jsonString = response.text.trim();
    
    // The model can sometimes wrap the JSON output in markdown code fences.
    // This regex will find the JSON content within ```json ... ```.
    const markdownMatch = jsonString.match(/^```json\s*([\s\S]*?)\s*```$/);
    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1];
    }

    const result = JSON.parse(jsonString);

    if (result && Array.isArray(result.files)) {
      // For modifications, the AI might only return changed files. We need to merge them.
      if (project.files && project.files.length > 0) {
        const updatedFiles = [...project.files];
        result.files.forEach((newFile: FileNode) => {
          const existingFileIndex = updatedFiles.findIndex(f => f.path === newFile.path);
          if (existingFileIndex !== -1) {
            // Update existing file
            updatedFiles[existingFileIndex] = newFile;
          } else {
            // Add new file
            updatedFiles.push(newFile);
          }
        });
        return updatedFiles;
      }
      return result.files;
    } else {
      throw new Error("Invalid JSON structure received from API.");
    }
  } catch (error) {
    console.error("Error generating website:", error);
    throw new Error("Failed to generate website from AI. Please check the console for more details.");
  }
};