#!/usr/bin/env python3
import os, sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("PORT", 8080))
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # silence request logs

print(f"Serving {ROOT} on port {PORT}", flush=True)
HTTPServer(("", PORT), Handler).serve_forever()
