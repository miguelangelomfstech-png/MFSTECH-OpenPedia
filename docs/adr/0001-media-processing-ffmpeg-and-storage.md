# ADR 0001: Media Upload Architecture & FFmpeg Transcoding Pipeline

- **Status**: Accepted
- **Deciders**: Senior Full-Stack Architect
- **Date**: 2026-10-19

## Context & Problem Statement

Openpedia allows any registered user to upload high-resolution images (JPEG, PNG, WebP, GIF, SVG up to 25MB) and long-form video (MP4, WebM, MOV up to 1GB).

Handling multi-gigabyte media uploads directly inside Next.js serverless functions or web request threads has critical drawbacks:
1. **Request Timeout & Memory Exhaustion**: Heavy multipart file parsing in Node.js web handlers stalls the V8 event loop and breaches HTTP gateway execution limits (e.g., 30–60s).
2. **CPU-Intensive Transcoding**: H.264/AAC multi-resolution encoding (`360p`, `720p`, `1080p`) saturates CPU cores and starves web request handling.
3. **Bandwidth Costs**: Serving media through application servers burns egress bandwidth and degrades latency.

## Decision Drivers

- **Zero Web Server Saturation**: Web containers must remain lightweight, fast, and responsive.
- **Direct-to-Storage Uploads**: Files stream directly from client browsers to S3/R2 storage via presigned URLs.
- **Asynchronous Scalable Workers**: CPU-bound FFmpeg jobs run independently in isolated worker containers.
- **Adaptive Bitrate / Ladder Delivery**: Automatically transcode videos into standard resolutions with fast-start flags (`+faststart`) for instant web playback.
- **Resilience**: Failed jobs retry with exponential backoff via Redis BullMQ and never block user edits.

## Considered Options

1. **Option 1**: Direct client-to-Next.js multipart uploads + in-process FFmpeg execution.
2. **Option 2**: Third-party SaaS video transcoders (Mux, Cloudflare Stream, AWS MediaConvert).
3. **Option 3 (Selected)**: Direct-to-S3 presigned client upload + asynchronous BullMQ queue + dedicated containerized FFmpeg & Sharp worker.

## Decision Outcome

Chosen **Option 3**:

```
[ Browser ] ─── 1. POST /api/media/presign ───> [ Next.js Web ]
     │                                                 │
     │ <── 2. Presigned S3 PUT URL + Media ID ─────────┘
     │
     ├─── 3. HTTP PUT (stream binary directly) ───> [ S3 / Cloudflare R2 ]
     │                                                     │
     ├─── 4. POST /api/media/complete ──> [ Next.js Web ] │
                                                │          │
                                   Enqueue BullMQ job      │
                                                ▼          │
                                       [ Redis Queue ]     │
                                                │          │
                                                ▼          │
                                       [ Worker Container ]│
                                       (FFmpeg + Sharp)    │
                                                │          │
                                    5. Stream original <───┘
                                    6. Multi-resolution encode
                                    7. Put renditions + poster ──> [ S3 / R2 ]
                                    8. Mark 'ready' in DB
                                    9. Enqueue Meilisearch index
```

### Video Transcoding Ladder Specification:

| Rendition | Resolution | Video Bitrate / CRF | Audio Codec & Bitrate | Moov Atom |
|---|---|---|---|---|
| `360p` | 640×360 (or aspect proportional) | H.264 CRF 28, preset veryfast | AAC stereo, 96 kbps | `+faststart` (web-optimized) |
| `720p` | 1280×720 | H.264 CRF 25, preset veryfast | AAC stereo, 128 kbps | `+faststart` |
| `1080p` | 1920×1080 | H.264 CRF 23, preset veryfast | AAC stereo, 160 kbps | `+faststart` |
| `poster` | Max 1280px width | JPEG q=3 frame extract at 10% mark | N/A | Standard |
| `thumb-400` | 400px width | WebP q=78 derived from poster | N/A | Standard |

### Image Rendition Specification:

- `thumb-400`: 400px max width WebP (for article inline thumbnails and search cards).
- `webp-800`: 800px max width WebP (for tablets and responsive srcset).
- `webp-1600`: 1600px max width WebP (for high-DPI desktop viewports).

## Consequences

- **Positive**: Web processes remain tiny (~150MB RAM) and zero video encoding occurs on web threads.
- **Positive**: S3/R2 presigned URLs offload all upload bandwidth from the main application server.
- **Positive**: Strict concurrency controls (`WORKER_CONCURRENCY_VIDEO=1`, `WORKER_CONCURRENCY_IMAGE=4`) protect the server from out-of-memory or CPU throttling.
- **Negative**: Requires FFmpeg installed in the worker container image (~80MB added to worker image).
