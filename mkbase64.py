import base64

with open("assets/index-CE8PVcMj.css", "rb") as f:
    data = base64.b64encode(f.read()).decode()
with open("css_b64.txt", "w") as f:
    f.write(data)

with open("assets/index-D3oYfD3k.js", "rb") as f:
    data = base64.b64encode(f.read()).decode()
with open("js_b64.txt", "w") as f:
    f.write(data)
