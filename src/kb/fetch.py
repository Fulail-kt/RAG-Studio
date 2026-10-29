import ipaddress
import socket
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import httpx

_SKIP_TAGS = {"script", "style", "noscript"}
_MAX_BYTES = 1_000_000
_MAX_REDIRECTS = 5


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in _SKIP_TAGS:
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in _SKIP_TAGS and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if self.skip:
            return
        text = " ".join(data.split())
        if text:
            self.parts.append(text)


def assert_public_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("only public http(s) URLs")
    host = parsed.hostname.lower()
    if host == "localhost" or host.endswith(".localhost"):
        raise ValueError("blocked host")
    try:
        addresses = socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror as exc:
        raise ValueError("host did not resolve") from exc
    for info in addresses:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise ValueError("blocked host")
    return url


def html_to_text(html: str) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    return "\n".join(parser.parts)


def fetch_public_page(url: str) -> str:
    current = url
    with httpx.Client(timeout=15, follow_redirects=False) as client:
        for _ in range(_MAX_REDIRECTS):
            current = assert_public_url(current)
            with client.stream(
                "GET",
                current,
                headers={"User-Agent": "RAGUserKB/1.0"},
            ) as response:
                if response.status_code in {301, 302, 303, 307, 308}:
                    location = response.headers.get("location")
                    if not location:
                        raise ValueError("redirect missing location")
                    current = urljoin(str(response.url), location)
                    continue
                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                if "html" not in content_type and not content_type.startswith("text/"):
                    raise ValueError("page is not text")
                raw = b""
                for block in response.iter_bytes():
                    raw += block
                    if len(raw) > _MAX_BYTES:
                        raise ValueError("page too large")
            text = raw.decode(response.encoding or "utf-8", errors="replace")
            if "html" in content_type:
                text = html_to_text(text)
            text = text.strip()
            if not text:
                raise ValueError("page had no text")
            return text[:50000]
    raise ValueError("too many redirects")
