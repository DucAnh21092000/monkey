#!/usr/bin/env bash
set -e

mkdir -p bin

curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
  -o bin/yt-dlp

chmod +x bin/yt-dlp