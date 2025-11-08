# main.py
from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Response
from fastapi.responses import StreamingResponse, JSONResponse
from ultralytics import YOLO
from gtts import gTTS
import numpy as np
import cv2
import base64
import os
import io
import traceback

# ----------------------------
# App & CORS
# ----------------------------
app = FastAPI(title="Object Detection + TTS API")

# TIP: Narrow allow_origins to your site when ready (e.g., ["https://your-site.vercel.app"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Model init
# ----------------------------
# Define the default model path
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")

# Use the environment variable if set, otherwise use the default path
MODEL_PATH = os.environ.get("MODEL_PATH", DEFAULT_MODEL_PATH)

# Some hosts require this to allow non-strict weight loading
os.environ["TORCH_WEIGHTS_ONLY"] = os.environ.get("TORCH_WEIGHTS_ONLY", "0")

print(f"[BOOT] MODEL_PATH: {MODEL_PATH} (exists={os.path.exists(MODEL_PATH)})")

model = None
model_load_error = None
try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    model_load_error = str(e)
    print("❌ Failed to load YOLO model:", model_load_error)


# ----------------------------
# Routes: health & root
# ----------------------------
@app.get("/")
def root():
    return {
        "status": "ML service running",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "model_error": model_load_error,
    }

@app.get("/health")
def health():
    if model is None:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": f"Model not loaded: {model_load_error}"},
        )
    return {"status": "ok"}

@app.options("/detect")
def options_detect():
    # Return 204; CORSMiddleware will inject the CORS headers.
    return Response(status_code=204)

# ----------------------------
# Detection route
# ----------------------------
@app.post("/detect")
async def detect(image: UploadFile = File(...)):
    """
    Accepts an image file and returns:
      - detections: [{bbox, label, conf}]
      - image: base64-encoded annotated JPG
    """
    if model is None:
        raise HTTPException(status_code=500, detail=f"Model not loaded: {model_load_error}")

    try:
        # Read bytes and decode to OpenCV image (BGR)
        data = await image.read()
        img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Unable to decode image")

        # Run inference
        r = model(img, imgsz=640, conf=0.5, iou=0.6, verbose=False)[0]

        # Prepare annotated image
        annotated = r.plot()
        ok, buf = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        if not ok:
            raise ValueError("Failed to encode annotated image")

        b64img = base64.b64encode(buf.tobytes()).decode("utf-8")

        # Build detections
        # Prefer names from result; fallback to model.names; else show class id
        names = getattr(r, "names", None) or getattr(model, "names", {}) or {}

        dets = []
        if getattr(r, "boxes", None) is not None:
            xyxys = getattr(r.boxes, "xyxy", None)
            clss  = getattr(r.boxes, "cls", None)
            confs = getattr(r.boxes, "conf", None)

            if xyxys is not None and clss is not None and confs is not None:
                xyxys = xyxys.tolist()
                clss  = clss.tolist()
                confs = confs.tolist()
                for xyxy, c, conf in zip(xyxys, clss, confs):
                    label = names.get(int(c), str(int(c))) if isinstance(names, dict) else str(int(c))
                    dets.append({
                        "bbox": xyxy,                 # [x1, y1, x2, y2]
                        "label": str(label),
                        "conf": float(conf)           # 0..1
                    })

        return {"detections": dets, "image": b64img}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"detect failed: {e}")

# ----------------------------
# TTS route (server-side)
# ----------------------------
# gTTS supports codes like "en" (English) and "tl" (Tagalog).
# Cebuano not natively supported -> fallback to EN.
LANG_MAP = {
    "en":  "en",
    "tl":  "tl",
    "ceb": "tl",  # fallback
}

@app.get("/api/tts")
def tts_get(text: str = Query(..., max_length=500), lang: str = "en"):
    """
    Returns an MP3 audio stream for the given text & language.
    Example: GET /api/tts?text=Hello&lang=tl
    """
    # Normalize/guard the input a little
    text = (text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Missing text")

    try:
        code = LANG_MAP.get(lang.lower(), "en")
        tts = gTTS(text=text, lang=code, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)

        return StreamingResponse(
            buf,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": 'inline; filename="tts.mp3"',
            },
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

# ----------------------------
# Local dev entry point
# ----------------------------
if __name__ == "__main__":
    # For local testing only; on Render/other hosts, use their process manager (e.g., gunicorn/uvicorn command)
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        reload=bool(int(os.environ.get("RELOAD", "0")))
    )
