import re
import pprint
import os

log_path = r'C:\Users\AARON\.gemini\antigravity\brain\241d7d82-a1bf-4474-a550-4ea3d186bec0\.system_generated\logs\overview.txt'

with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

# We can search for the last occurrence of the App.tsx content.
# Since I wrote it as a single chunk using `replace_file_content` or `write_to_file`, I can look for:
# "TargetFile": "...\App.tsx",
# "ReplacementContent": "..." or "CodeContent": "..."

print("Scanning for App.tsx...")
matches = list(re.finditer(r'TargetFile[^}]+App\.tsx[^}]+(?:ReplacementContent|CodeContent)[\s\S]{10,20}', text))
print(f"Found {len(matches)} matches")

if len(matches) > 0:
    # Just grab the last JSON-like structure that wrote to App.tsx
    # A simpler way is to find the exact json payload:
    import json
    chunks = text.split('"TargetFile"')
    for chunk in reversed(chunks):
        if "App.tsx" in chunk[:50]:
            # This chunk might belong to a tool call
            print(f"Candidate chunk starting with: {chunk[:100]}")
            # Try to grab the previous properties that were in this JSON object.
            break

