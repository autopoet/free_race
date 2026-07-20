from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
BASE_PATH = "/free_race"


class PwaPreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def translate_path(self, path: str) -> str:
        parsed_path = unquote(urlparse(path).path)
        if parsed_path == BASE_PATH:
            parsed_path = "/"
        elif parsed_path.startswith(f"{BASE_PATH}/"):
            parsed_path = parsed_path[len(BASE_PATH) :]
        return super().translate_path(parsed_path)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 4173), PwaPreviewHandler).serve_forever()
