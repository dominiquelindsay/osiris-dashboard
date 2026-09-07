import base64
import json

with open("assets/index-CE8PVcMj.css", "rb") as f:
    css_b64 = base64.b64encode(f.read()).decode()

with open("assets/index-D3oYfD3k.js", "rb") as f:
    js_b64 = base64.b64encode(f.read()).decode()

with open("index.html", "r") as f:
    html = f.read()

# Create inline HTML with everything embedded
inline_html = html.replace(
    '<script type="module" crossorigin src="/assets/index-D3oYfD3k.js"></script>',
    f'<script type="module">{base64.b64decode(js_b64).decode("utf-8")}</script>'
).replace(
    '<link rel="stylesheet" crossorigin href="/assets/index-CE8PVcMj.css">',
    f'<style>{base64.b64decode(css_b64).decode("utf-8")}</style>'
)

with open("inline.html", "w", encoding="utf-8") as f:
    f.write(inline_html)

print(f"HTML size: {len(inline_html)} chars")
print(f"CSS size: {len(css_b64)} base64 chars")
print(f"JS size: {len(js_b64)} base64 chars")
