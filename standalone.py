import base64
import json

with open("index.html", "r") as f:
    html = f.read()

with open("assets/index-CE8PVcMj.css", "rb") as f:
    css = base64.b64encode(f.read()).decode()

with open("assets/index-D3oYfD3k.js", "rb") as f:
    js = f.read().decode("utf-8")

# Check if JS has external imports
import_count = js.count("import {")
print(f"Import count: {import_count}")

# The JS might be self-contained if Vite bundled it properly
# Let's create a single HTML with inline script
inline_html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>OSIRIS | Open Source Intelligence</title>
<style>{base64.b64decode(css).decode("utf-8")}</style>
</head>
<body class="crt-scanlines crt-noise">
<div id="root"></div>
<script type="module">{js}</script>
</body>
</html>"""

with open("standalone.html", "w", encoding="utf-8") as f:
    f.write(inline_html)

print(f"Standalone HTML size: {len(inline_html)} chars")
