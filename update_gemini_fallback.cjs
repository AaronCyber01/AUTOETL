const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'src', 'services', 'geminiService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add FALLBACK_MODEL_NAME and the wrapper function if it doesn't exist
if (!content.includes('generateContentWithFallback')) {
    const wrapperInsertion = `const MODEL_NAME = "gemini-3-flash-preview";
const FALLBACK_MODEL_NAME = "gemini-3.1-flash-lite";

async function generateContentWithFallback(params: any): Promise<any> {
    try {
        return await ai.models.generateContent(params);
    } catch (error: any) {
        if (error?.status === 429 && params.model === MODEL_NAME) {
            console.warn(\`[AutoETL Failover] Rate limit (429) hit on \${MODEL_NAME}. Downgrading to fallback model: \${FALLBACK_MODEL_NAME}...\`);
            return await ai.models.generateContent({
                ...params,
                model: FALLBACK_MODEL_NAME
            });
        }
        throw error;
    }
}`;
    
    content = content.replace(
        'const MODEL_NAME = "gemini-3-flash-preview";',
        wrapperInsertion
    );

    // Replace all instances of `await ai.models.generateContent({` with `await generateContentWithFallback({`
    content = content.replace(/await ai\.models\.generateContent\(\{/g, 'await generateContentWithFallback({');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully injected LLM Fallback wraper.");
} else {
    console.log("Fallback already implemented.");
}
