# Generates every clip in audio-manifest.json with Azure neural voices, ready for app/public/audio/.
#
# In Google Colab:
#   1. Secrets (key icon): AZURE_SPEECH_KEY and AZURE_SPEECH_REGION, with notebook access on.
#   2. Upload tools/audio-manifest.json (Files panel).
#   3. Run this cell. Try LIMIT = 10 first, then LIMIT = None for everything.
#   4. Download audio.zip and unzip it into app/public/audio/ (one folder per voice).
# Clips are saved to Google Drive and existing ones are skipped, so a dropped session resumes
# without spending characters again. The free tier throttles requests; the loop waits on 429.

import json
import os
import shutil
import time
from xml.sax.saxutils import escape

import requests
from google.colab import drive, userdata

drive.mount("/content/drive")
OUT = "/content/drive/MyDrive/mandarin-audio"

KEY = userdata.get("AZURE_SPEECH_KEY")
REGION = userdata.get("AZURE_SPEECH_REGION")
URL = f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1"

# Keep in sync with app/src/data/voices.json
VOICES = {
    "wawa": "zh-CN-XiaoxiaoNeural",
    "harpia": "zh-CN-YunjianNeural",
    "sloth": "zh-CN-YunxiNeural",
    "tucan": "zh-CN-XiaoyiNeural",
}
LIMIT = 10

items = json.load(open("/content/audio-manifest.json", encoding="utf-8"))["items"][:LIMIT]


def tts(text, voice, rate):
    ssml = (
        f'<speak version="1.0" xml:lang="zh-CN"><voice name="{voice}">'
        f'<prosody rate="{rate}">{escape(text)}</prosody></voice></speak>'
    )
    for _ in range(10):
        r = requests.post(
            URL,
            data=ssml.encode("utf-8"),
            headers={
                "Ocp-Apim-Subscription-Key": KEY,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
                "User-Agent": "mandarin-hub",
            },
        )
        if r.status_code == 429:
            time.sleep(int(r.headers.get("Retry-After", 0) or 15))
            continue
        r.raise_for_status()
        return r.content
    raise RuntimeError(f"No se pudo generar: {text}")


chars = 0
for character, voice in VOICES.items():
    folder = f"{OUT}/{voice}"
    os.makedirs(folder, exist_ok=True)
    for n, item in enumerate(items, 1):
        path = f"{folder}/{item['id']}.mp3"
        if os.path.exists(path):
            continue
        # Words a little slower so each syllable is clear
        rate = "-10%" if item["kind"] == "word" else "0%"
        open(path, "wb").write(tts(item["text"], voice, rate))
        chars += len(item["text"])
        if n % 50 == 0:
            print(f"{character} ({voice}): {n}/{len(items)}")
    print(f"✅ {character} ({voice}) listo")

shutil.make_archive("/content/audio", "zip", OUT)
print(f"Caracteres usados: {chars} · audio.zip listo para descargar")
