import io
import struct
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "build" / "icon-source.png"
BUILD_DIR = ROOT / "build"
ASSETS_DIR = ROOT / "src" / "assets"


def fit_square(image, size):
    image = image.convert("RGBA")
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - image.width) // 2
    y = (size - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    return canvas


def png_bytes(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def write_icns(sizes):
    entries = [
        ("icp4", 16),
        ("icp5", 32),
        ("icp6", 64),
        ("ic07", 128),
        ("ic08", 256),
        ("ic09", 512),
        ("ic10", 1024),
    ]
    chunks = []
    for code, size in entries:
        data = png_bytes(sizes[size])
        chunks.append(code.encode("ascii") + struct.pack(">I", len(data) + 8) + data)
    payload = b"".join(chunks)
    (BUILD_DIR / "icon.icns").write_bytes(b"icns" + struct.pack(">I", len(payload) + 8) + payload)


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing source icon: {SOURCE}")

    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    source = Image.open(SOURCE)
    sizes = {size: fit_square(source.copy(), size) for size in (16, 24, 32, 48, 64, 128, 256, 512, 1024)}

    sizes[1024].save(BUILD_DIR / "icon.png", format="PNG")
    sizes[1024].save(ASSETS_DIR / "icon.png", format="PNG")
    sizes[256].save(
        BUILD_DIR / "icon.ico",
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    write_icns(sizes)


if __name__ == "__main__":
    main()
