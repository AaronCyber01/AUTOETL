import json
import re

log_path = r'C:\Users\AARON\.gemini\antigravity\brain\241d7d82-a1bf-4474-a550-4ea3d186bec0\.system_generated\logs\overview.txt'

with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

# We look for "CodeContent": "..." followed by "TargetFile": "...\App.tsx"
# Or "TargetFile": "...\App.tsx" followed by "CodeContent": "..."
# Because it's written in `overview.txt`, it's printed as JSON tool calls.
# Let's find all occurrences of "replace_file_content" or "write_to_file" that target App.tsx

import ast
blocks = re.findall(r'(?:call:default_api:(?:write_to_file|replace_file_content|multi_replace_file_content)\s*(\{.*?\}))', text, re.DOTALL)

print(f"Found {len(blocks)} tool call blocks.")
for i, b in enumerate(blocks):
    if "App.tsx" in b:
        print(f"--- Block {i} ---")
        try:
            # It's usually pseudo-json but with unquoted keys or so. But the system log writes exact JSON.
            # actually wait, the prompt says tool calls look like:
            # call:default_api:write_to_file{"CodeContent": "...", "TargetFile": "..."}
            data = json.loads(b)
            if data.get('TargetFile', '').endswith("App.tsx") or data.get('TargetFile', '').endswith("index.css"):
                if 'CodeContent' in data:
                    outname = data['TargetFile'].split('\\')[-1] + f"_{i}.txt"
                    with open(outname, 'w', encoding='utf-8') as outf:
                        outf.write(data['CodeContent'])
                    print(f"Saved {outname}")
                elif 'ReplacementContent' in data:
                    print("Found ReplacementContent block")
                elif 'ReplacementChunks' in data:
                    print("Found ReplacementChunks block")
        except Exception as e:
            print(f"Error parsing json in block {i}: {e}")
            # fallback: regex
            code_match = re.search(r'"CodeContent"\s*:\s*"(.*?)(?<!\\)"', b, re.DOTALL)
            if code_match:
                print("Found match via regex")
