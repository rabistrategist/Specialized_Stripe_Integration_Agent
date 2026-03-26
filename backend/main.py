import os
import logging
import json
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from rag_engine import RAGEngine

load_dotenv()
logger = logging.getLogger(__name__)

rag: RAGEngine | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag
    logger.info("Initialising RAG engine ...")
    rag = RAGEngine()
    logger.info("RAG engine ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(title="DocBot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    topic: Literal["stripe", "google_auth"] = "stripe"


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


class StatusResponse(BaseModel):
    status: str
    message: str


# ── Routes ─────────────────────────────────────────────────────────────────
@app.get("/", response_model=StatusResponse)
def root():
    return {"status": "ok", "message": "DocBot API is running."}


@app.get("/health", response_model=StatusResponse)
def health():
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG engine not ready.")
    return {"status": "ok", "message": "RAG engine is loaded and ready."}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """Non-streaming fallback endpoint."""
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG engine not ready.")
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    try:
        result = rag.query(question=req.message, topic=req.topic)
        return ChatResponse(answer=result["answer"], sources=result["sources"])
    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    Server-Sent Events streaming endpoint.
    Streams tokens as 'data: <token>\\n\\n' lines.
    Final line carries sources as 'data: __SOURCES__[...]\\n\\n'.
    """
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG engine not ready.")
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    async def event_generator():
        try:
            async for chunk in rag.stream_query(
                question=req.message,
                topic=req.topic,
            ):
                # SSE format: each chunk is "data: <payload>\n\n"
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps(f'ERROR: {str(e)}')}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",       # disable nginx buffering if behind proxy
        },
    )


@app.post("/reingest", response_model=StatusResponse)
def reingest():
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG engine not ready.")
    try:
        rag.reingest()
        return {"status": "ok", "message": "Vectorstore rebuilt successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))