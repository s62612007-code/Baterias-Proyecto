#!/usr/bin/env python3
"""Sube dist/ por FTP a bateriascali.es y hondabateriacali.com."""

from __future__ import annotations

import os
import sys
from ftplib import FTP, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
REMOTE_ROOT = os.environ.get("REMOTE_ROOT", "html")
TIMEOUT = int(os.environ.get("FTP_TIMEOUT", "300"))
BLOCK = 262144


def ensure_dir(ftp: FTP, path: str) -> None:
    parts = [p for p in path.split("/") if p]
    ftp.cwd("/")
    for part in parts:
        try:
            ftp.cwd(part)
        except error_perm:
            ftp.mkd(part)
            ftp.cwd(part)
    ftp.cwd("/")


def should_upload(path: Path) -> bool:
    rel = path.as_posix()
    if "/assets/images/products/" in rel and path.suffix == ".png":
        return False
    return True


def upload_site(label: str, host: str, user: str, password: str, site_url: str) -> int:
    print(f"\n▶ {label} → {user}@{host} ({site_url})")
    ftp = FTP(host, timeout=TIMEOUT)
    ftp.login(user, password)
    count = 0
    for path in sorted(DIST.rglob("*")):
        if not path.is_file() or not should_upload(path):
            continue
        rel = path.relative_to(DIST).as_posix()
        remote = f"{REMOTE_ROOT}/{rel}"
        remote_dir = "/".join(remote.split("/")[:-1])
        if remote_dir:
            ensure_dir(ftp, remote_dir)
        with path.open("rb") as handle:
            ftp.storbinary(f"STOR {remote}", handle, blocksize=BLOCK)
        print(f"  ↑ {remote}")
        count += 1
    ftp.quit()
    print(f"✓ {count} archivos → {site_url}/")
    return count


def main() -> int:
    if not DIST.is_dir():
        print("Ejecute npm run build primero")
        return 1

    sites = [
        (
            "bateriascali.es",
            os.environ.get("BATERIASCALI_FTP_HOST", os.environ.get("FTP_HOST", "217.76.150.40")),
            os.environ.get("BATERIASCALI_FTP_USER", "bateriascali.es"),
            os.environ.get("BATERIASCALI_FTP_PASS", os.environ.get("FTP_PASS", "")),
            os.environ.get("BATERIASCALI_SITE_URL", "https://bateriascali.es"),
        ),
        (
            "hondabateriacali.com",
            os.environ.get("HONDA_FTP_HOST", "217.76.150.40"),
            os.environ.get("HONDA_FTP_USER", "hondabateriacali.com"),
            os.environ.get("HONDA_FTP_PASS", os.environ.get("DEPLOY_PASS", "")),
            os.environ.get("HONDA_SITE_URL", "https://hondabateriacali.com"),
        ),
    ]

    total = 0
    for label, host, user, pw, url in sites:
        if not pw:
            print(f"✗ Sin contraseña FTP para {label}", file=sys.stderr)
            return 1
        total += upload_site(label, host, user, pw, url.rstrip("/"))

    print(f"\n✓ Despliegue dual completado ({total} archivos en total)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
