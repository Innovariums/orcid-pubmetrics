"""
Arreglar CSVs SJR descargados via Playwright.

El MCP de Playwright serializó el texto devuelto como JSON, así que cada
archivo tiene:
- un " al inicio
- un " al final
- \n escapados en vez de newlines reales
- \" escapados en vez de " reales

Este script normaliza todo. Idempotente: detecta si ya está limpio.
"""
import pathlib

SJR_DIR = pathlib.Path("data/sjr")

for f in sorted(SJR_DIR.glob("scimagojr_*.csv")):
    data = f.read_bytes()
    changed = False

    # 1. Unescape \" -> "  y  \n -> newline (orden importa: \" primero)
    if b'\\"' in data:
        data = data.replace(b'\\"', b'"')
        changed = True
    if b"\\n" in data:
        data = data.replace(b"\\n", b"\n")
        changed = True

    # 2. Strip leading quote si es el primer byte
    if data.startswith(b'"'):
        data = data[1:]
        changed = True

    # 3. Strip trailing quote (opcionalmente precedido/seguido de newline)
    data = data.rstrip(b"\r\n")
    if data.endswith(b'"'):
        data = data[:-1]
        changed = True
    data = data + b"\n"  # asegurar newline final

    if changed:
        f.write_bytes(data)
        print(f"{f.name}: fixed -> {len(data)} bytes, {data.count(b'\n')} lines")
    else:
        print(f"{f.name}: already clean, {data.count(b'\n')} lines")
