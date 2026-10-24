# Awareness Engine live-camera report — 24 October 2026

## Completed

- Replaced the missing ByteTrack assignment dependency with `lap==0.5.13`; `ByteTrackBottleTracker` now checks `lap.lapjv` before camera inference and reports a corrective installation command if it is absent.
- Pinned the local macOS arm64 / Python 3.14.7 stack: `torch==2.14.1`, `torchvision==0.29.1`, `ultralytics==8.4.187`, `lap==0.5.13`, and `opencv-python==5.0.0.93`. The headless OpenCV package was removed because it cannot display the live Cocoa window.
- Added camera first-frame timeout, disconnect detection, explicit macOS AVFoundation selection, clean keyboard interruption, track-loss propagation, per-track confidence overlays, trajectories, zone overlays, image-quality status, low-light CLAHE/gamma preprocessing, and optional person inclusion for ambiguity marking.
- Kept device integration unchanged: terminal rewards still require a signed v2 device event, a bound session and EcoP policy. A frame detection or zone overlap never grants points.

## Actual camera validation

The following ran against the physical MacBook camera at index `0`; it did not use a simulated source, static image or mock detector:

```bash
cd /Users/prathambhat/Desktop/EcoP/companion/awareness-engine
.venv/bin/python -m awareness_engine.app.main --runtime realtime --mode webcam --camera-index 0 --model-path weights/yolo11n.pt --no-window --max-frames 240
```

Observed runtime facts:

- Camera opened and produced frames.
- YOLO11n loaded on Apple MPS.
- ByteTrack initialized with `lap 0.5.13`; the prior `ModuleNotFoundError: lap` did not recur.
- Real bottle tracks were created from camera frames and zone transitions were processed.
- Average camera FPS: **23.3**; inference/tracking FPS: **23.0**; average inference/tracking time: **45 ms**; end-to-end latency: **63 ms**. These values describe this local run only.
- Tracks that entered the visual disposal zone and were then lost were recorded as **inconclusive**. No calibrated `ECOP_RIM_RECT` or physical sensors were configured, so the run made no verified-disposal or reward claim.

The same command without `--no-window` starts the Cocoa visualization window with bounding boxes, confidence, stable track IDs, paths, zones, detection count, image quality and live metrics. Press `Q` in that window to close it; the handler has an automated regression test.

## Automated validation

- `python -m pytest tests -q`: **39 passed**.
- `py_compile`: passed.
- `pip check`: passed.
- YOLO11n + ByteTrack MPS warmup: passed.

## Required station work before a physical-disposal claim

The supplied zones are a 640×480 preview layout and must be calibrated for the mounted camera. Configure `ECOP_RIM_RECT` after measuring the bin rim, validate it against real retraction/side-entry/occlusion cases, and connect actual beam/load readings where sensor fusion is intended. Obtain user consent and camera privacy approval. Without those steps, the engine correctly limits results to observation, suspected incorrect, or inconclusive states.
