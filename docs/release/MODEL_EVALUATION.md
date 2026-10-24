# Model and tracking evaluation — 24 October 2026

## Decision

Retain the companion's YOLO11n + explicit ByteTrack configuration. The optional GroundingDINO pipeline is preserved. No model weights were replaced. No labeled EcoP footage, detector checkpoints, deployment camera, calibrated sensors or target edge hardware were supplied. Consequently, **no EcoP detector accuracy, model latency or hardware-verification result is claimed**. Simulation and geometric tests exercise software logic, not model quality.

The upstream realtime configuration uses `weights/yolo11n.pt` and `bytetrack.yaml`. Its requirements pinned Ultralytics 8.2.0, predating YOLO11 support; the runtime requirements now allow a compatible version and require a target-platform lock before deployment. Test dependencies are separately pinned. Model files must be provisioned and integrity-checked; the observation API refuses to auto-download missing weights.

## Research findings (primary sources)

| Candidate | Relevant capability | EcoP decision |
| --- | --- | --- |
| [YOLO11](https://docs.ultralytics.com/models/yolo11) | Existing Ultralytics detector baseline; available sizes and export formats | Retain baseline and evaluate bottle class on site footage |
| [YOLO26](https://docs.ultralytics.com/models/yolo26) | Native end-to-end inference and revised detection head; optimized deployment is a reason to test, not proof of local improvement | Benchmark same input size, precision and target device before considering replacement |
| [RF-DETR](https://rfdetr.roboflow.com/learn/benchmarks/) | Transformer detector with published COCO and RF100-VL comparisons | Include small models; published aggregate AP is not disposal-event precision or device latency |
| [ByteTrack](https://github.com/FoundationVision/ByteTrack) | Associates detections across confidence levels | Keep as explicit baseline; measure identity switches under hand occlusion |
| [BoT-SORT](https://github.com/NirAharon/BoT-SORT) | Motion and appearance association; camera motion handling | Evaluate if occlusion/identity errors justify extra computation |
| [OC-SORT](https://github.com/noahcao/OC_SORT) | Observation-centric tracking for occlusion and nonlinear motion | Useful comparison for rapid rim crossings and withdrawal |

[Ultralytics tracking documentation](https://docs.ultralytics.com/modes/track) confirms tracker selection and additional tracker support depends on library version. The code keeps `bytetrack.yaml` explicit to avoid a default changing under it. Verify licenses of the selected code and weights for the deployment; no license entitlement is inferred from public downloadability.

## Implemented improvements

- No invented IDs when a detector result lacks a tracker ID.
- Class-gated association in the simple simulation tracker.
- Both minimum frames and dwell time are required; zone timestamps use the same clock as tracks.
- Optional calibrated rim-crossing state rejects side entry, withdrawal, time reversal and long gaps.
- Missing occupancy information remains ambiguous. Optional person-class detections can establish a single-person observation, without face recognition; field validation is still required.
- A track binds to the active QR session when first observed. A later user's session never inherits an earlier unbound track.
- Device/boot/track identity and session uniqueness are persisted in PostgreSQL. Signed events are fresh, scoped to a device's bin and immutable across retries.
- Vision-only and sensor-fused policies are distinct. Unknown hardware evidence is `null`, never a fabricated `true`. Stations default to manual review.

## Reproducible benchmark protocol

1. Collect consented, stratified footage: empty/crushed/transparent bottles, other objects, reflections, hands, retraction, occlusion, side entry, repeated bottles, two users, night lighting and camera vibration. Separate train/validation/test by recording day and station.
2. Annotate detection boxes, track identities, rim crossing, physical disposal truth and session attribution. Capture independent beam/load data when testing sensor fusion. Keep a dataset SHA-256 manifest.
3. Run YOLO11, YOLO26 and RF-DETR at matched image size, batch 1 and precision on the actual edge device. Exclude warm-up, synchronize accelerators for latency, record memory, power and dropped frames. Pair tracker candidates under the same detector.
4. Report bottle AP, recall, IDF1/HOTA and identity switches; then end-to-end event precision/recall, false awards, duplicate awards, wrong-user awards, uncertainty rate and p50/p95/p99 latency. Report confidence intervals and results by scenario.
5. Export event predictions to the schema documented in `companion/awareness-engine/evaluation/compare.py`. Run it on baseline/candidate artifacts. It rejects mismatched hardware/datasets and synthetic data cannot pass its deployment gate. At least 1,000 real events, ≥99.5% event precision, no wrong-user/duplicate awards, non-regressing recall/false awards/p95 latency and a meaningful improvement are initial acceptance criteria. These are proposed gates, not observed results.
6. Review false-positive clips and sensor calibration before enabling automatic rewards at a station. Keep a rollback model/lockfile and signed evaluation manifest.

## Executed evaluation

See TEST_REPORT.md for actual software-test counts. Geometry, temporal rules, outbox retries, session binding and benchmark-scoring tests ran locally. Actual YOLO11/YOLO26/RF-DETR inference and comparative hardware benchmarks remain **not run** because the required footage, weights and target equipment are absent. The scorer's fixture tests must not be presented as detector performance.
