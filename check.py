with open("standalone.html", "rb") as f:
    d = f.read()
print(f"Size: {len(d)} bytes")
print(f"First 200 chars: {d[:200]!r}")
