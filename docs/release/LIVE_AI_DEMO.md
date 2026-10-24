# Live AI Demo

`/demo/live` is an authenticated browser view for a real local Awareness Engine camera. It uses a server-side Next.js proxy so the browser never receives the engine URL, engine API key, device HMAC secret, model weights, or raw event-publisher configuration.

The engine owns one camera capture, one YOLO11n/ByteTrack worker and one annotated MJPEG producer. Multiple viewers share that work. The page receives the latest image through `/api/demo/live/stream` and actual detector/tracker/zone events through `/api/demo/live/events` SSE. Frames are kept only as the latest in-memory JPEG; the feature does not retain footage.

## Security and reward boundary

- In development, access requires both `ECOP_DEMO_MODE=true` and `ECOP_LIVE_DEMO_LOCAL=true`. This local switch is rejected in production mode.
- Outside local demo mode, every live-demo API route requires a signed-in EcoP administrator. The route validates the session before opening the proxied stream.
- FastAPI also requires `X-API-Key`, applies bounded in-process request limits, only accepts configured camera indices, and is intended to bind to loopback.
- The browser preview is observation-only. It starts no QR session, has no device credential, and calls no disposal/reward/review API. Its response displays `sessionVerification: not_submitted` and `pointsAwarded: 0`.
- The separate registered-device publisher retains the only reward candidate path: it freezes a QR-session binding at `TRACK_CREATED`, signs the v2 body, stores it in a SQLite outbox, retries identical bytes, and submits it to EcoP. The API/database then checks device/bin/session/time/event/boot-track idempotency and station policy before any reward or review result.

## Local startup

Keep the private Awareness Engine checkout and its weights local. Do not commit `.env`, recordings, SQLite outboxes, or model weights.

```bash
cd /Users/prathambhat/Desktop/EcoP/companion/awareness-engine
.venv/bin/python -m uvicorn awareness_engine.api.main:app --host 127.0.0.1 --port 8000
```

In the ignored root `.env.local`, use the matching engine key:

```text
ECOP_DEMO_MODE=true
ECOP_LIVE_DEMO_LOCAL=true
ECOP_AWARENESS_ENGINE_URL=http://127.0.0.1:8000
ECOP_AWARENESS_ENGINE_API_KEY=<same ENGINE_API_KEY>
```

Then run `npm run dev -- --port 3100` from the EcoP root and open `http://localhost:3100/demo/live`. Start the camera from the page. The engine surfaces missing permissions, opening failures, repeated read failures, model/tracker errors and stream encoding failures as an explicit failed status and SSE error event.

## Evidence interpretation

The stream overlays are real model output: bottle boxes, confidence, ByteTrack IDs, path segments, configured zones, image quality and latency/FPS values. They prove only that this local model observed those pixels. A configured directional rim crossing and temporal dwell can create a **vision candidate**; lack of calibration, occlusion/lost tracks, withdrawal and sensor disagreement remain inconclusive or suspected incorrect. No live browser candidate can become a confirmed disposal or points award.

The prior `AWARENESS_ENGINE_LIVE_REPORT.md` records a separate direct webcam smoke run. Treat its measured figures as local historical measurements, not service-level promises. Station deployment still requires camera-zone/rim calibration, consent/privacy review, hardware-sensor validation where applicable, staging auth/RLS checks and a supervised field trial.
