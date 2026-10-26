# Generates every clip in audio-manifest.json with Kokoro, ready for app/public/audio/.
#
# In Google Colab:
#   1. Upload tools/audio-manifest.json (Files panel on the left).
#   2. Run:  !pip install -q "kokoro>=0.9.4" "misaki[zh]" soundfile pydub
#   3. Paste this file into a cell and run it. Set VOICES below to the voices you chose.
#   4. Download audio.zip and unzip it into app/public/audio/ (one folder per voice).
#
# Re-running skips clips that already exist, so a dropped Colab session can resume.
# Mount Google Drive and point OUT_DIR there to keep progress across sessions.

import io
import json
import os
import shutil

import numpy as np
import soundfile as sf
from kokoro import KPipeline
from pydub import AudioSegment, effects
from pydub.silence import detect_leading_silence

MANIFEST = "audio-manifest.json"
OUT_DIR = "audio"
# None uses the voices listed in the manifest. Otherwise e.g. ["zf_xiaoxiao", "zm_yunjian", ...]
VOICES = None
# Words are read a little slower than sentences so each syllable is clear.
SPEED = {"word": 0.9, "sentence": 1.0}
SAMPLE_RATE = 24000
PAD_MS = 80  # silence kept before and after each clip

manifest = json.load(open(MANIFEST, encoding="utf-8"))
voices = VOICES or manifest["voices"]
items = manifest["items"]
pipeline = KPipeline(lang_code="z")  # Mandarin


def synthesize(text: str, voice: str, speed: float) -> AudioSegment:
    chunks = [audio for _, _, audio in pipeline(text, voice=voice, speed=speed)]
    samples = np.concatenate([c.numpy() if hasattr(c, "numpy") else np.asarray(c) for c in chunks])
    wav = io.BytesIO()
    sf.write(wav, samples, SAMPLE_RATE, format="WAV")
    wav.seek(0)
    return AudioSegment.from_wav(wav)


def tidy(seg: AudioSegment) -> AudioSegment:
    """Trim silence at both ends, pad evenly, and normalise loudness so every clip sounds alike."""
    start = detect_leading_silence(seg, silence_threshold=-45)
    end = detect_leading_silence(seg.reverse(), silence_threshold=-45)
    seg = seg[start : len(seg) - end]
    pad = AudioSegment.silent(duration=PAD_MS, frame_rate=seg.frame_rate)
    return effects.normalize(pad + seg + pad, headroom=1.0).set_channels(1)


for voice in voices:
    folder = os.path.join(OUT_DIR, voice)
    os.makedirs(folder, exist_ok=True)
    done = 0
    for item in items:
        out = os.path.join(folder, f"{item['id']}.mp3")
        if os.path.exists(out):
            done += 1
            continue
        try:
            seg = tidy(synthesize(item["text"], voice, SPEED[item["kind"]]))
            seg.export(out, format="mp3", bitrate="48k")
        except Exception as e:  # keep going; failed clips fall back to the device voice in the app
            print(f"  ! {voice} {item['id']} {item['text']}: {e}")
            continue
        done += 1
        if done % 50 == 0:
            print(f"{voice}: {done}/{len(items)}")
    print(f"{voice}: {done}/{len(items)} listo")

shutil.make_archive("audio", "zip", OUT_DIR)
print("audio.zip listo para descargar")
