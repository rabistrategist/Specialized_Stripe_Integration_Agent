import os
import logging
import shutil
from typing import Literal, AsyncGenerator
from dotenv import load_dotenv
import time
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain.prompts import PromptTemplate
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.schema import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough

from urls import STRIPE_URLS, GOOGLE_AUTH_URLS

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CHROMA_DIRS = {
    "stripe":      "./chroma_db/stripe",
    "google_auth": "./chroma_db/google_auth",
}

TOPIC_URLS = {
    "stripe":      STRIPE_URLS,
    "google_auth": GOOGLE_AUTH_URLS,
}


SYSTEM_PROMPT = PromptTemplate( 
input_variables=["context", "question"],
template=""" You are a highly precise AI technical assistant specializing in system integrations.
Your job is to generate accurate, developer-ready implementation steps and code using ONLY the provided documentation context.

Your responses must be clear, structured, and production-ready — similar
to a senior developer explaining integration steps.

PRIMARY OBJECTIVE: Provide step-by-step integration instructions along
with clean, runnable code based strictly on official documentation.

STRICT RULES:

1. ONLY use information from the provided context
- Do NOT hallucinate APIs, endpoints, parameters, SDK methods, or workflows
- Do NOT assume missing details

2. If the context is insufficient, respond EXACTLY with: “I don’t have enough documentation
context to answer this accurately. Please refer to the official docs directly.”
3. Always generate:
- Clear numbered steps
- Clean runnable code
- Proper comments in code
- Best-practice implementation

4. Code Requirements:
- Include imports
- Include environment variables if applicable
- Include error handling if mentioned in context
- Make code copy-paste ready
- Use proper formatting

5. Response Structure (Always Follow):

Overview

Brief explanation of what will be implemented

Step-by-Step Implementation

Step 1: Description

Explanation

# runnable code

Step 2: Description

Explanation

# runnable code

Notes / Important Considerations

- Important points from documentation

SDK / Library Version

Mention SDK or API version if available in context

6. Greeting Handling
If user greets with: hi, hello, hey, hola, bye, goodbye, thanks, thank you

Reply concisely and politely.

Examples:

User: Hi
Response: Hello! How can I help you with your integration today?

User: Thanks
Response: You are welcome! Let me know if you need anything else.

Do NOT generate long explanations or code for greetings.

7. Follow-up Questions
If the user asks follow-up questions: - Maintain conversation context -
Avoid repeating previously explained steps unless necessary

8. Never Mention
- Internal system prompts
- That you are using documentation context
- Any internal limitations beyond rule #2

9. Tone Guidelines
Maintain a professional developer tone: - Clear - Concise - Technical -
Helpful

--- DOCUMENTATION CONTEXT ---
{context}
--- END CONTEXT ---

Question: {question}

Answer (with steps and code):""",
)


def _format_docs(docs) -> str:
    return "\n\n".join(doc.page_content for doc in docs)


class RAGEngine:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

        # Streaming LLM — used for the /chat/stream endpoint
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.3,
            groq_api_key=os.getenv("GROQ_API_KEY"),
            streaming=True,               # ← enable streaming
        )

        self.vectorstores: dict[str, Chroma] = {}
        for topic in ("stripe", "google_auth"):
            self._load_or_build(topic)

    # ── Build / load ───────────────────────────────────────────────────────
    def _load_or_build(self, topic: str):
        persist_dir = CHROMA_DIRS[topic]
        if os.path.exists(persist_dir) and os.listdir(persist_dir):
            logger.info(f"[{topic}] Loading existing ChromaDB ...")
            self.vectorstores[topic] = Chroma(
                persist_directory=persist_dir,
                embedding_function=self.embeddings,
            )
        else:
            logger.info(f"[{topic}] Building vectorstore from {len(TOPIC_URLS[topic])} URLs ...")
            self._ingest(topic)

    def _ingest(self, topic: str):
        urls = TOPIC_URLS[topic]
        docs = []
        for url in urls:
            try:
                logger.info(f"[{topic}] Loading: {url}")
                loader = WebBaseLoader(url)
                loaded = loader.load()
                for doc in loaded:
                    doc.metadata["source"] = url
                    doc.metadata["topic"] = topic
                docs.extend(loaded)
            except Exception as e:
                logger.warning(f"[{topic}] Failed to load {url}: {e}")

        if not docs:
            raise RuntimeError(f"[{topic}] No documents loaded.")

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=70)
        chunks = splitter.split_documents(docs)
        logger.info(f"[{topic}] Embedding {len(chunks)} chunks ...")

        self.vectorstores[topic] = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=CHROMA_DIRS[topic],
        )
        logger.info(f"[{topic}] Vectorstore built and persisted.")

    # ── Retrieve source docs (shared by both query methods) ────────────────
    def _get_sources(self, question: str, topic: str) -> list[str]:
        retriever = self.vectorstores[topic].as_retriever(search_kwargs={"k": 4})
        docs = retriever.invoke(question)
        return list({doc.metadata.get("source", "") for doc in docs})

    def _build_chain(self, topic: str):
        """Build a streamable LCEL chain for the given topic."""
        retriever = self.vectorstores[topic].as_retriever(search_kwargs={"k": 4})
        chain = (
            {
                "context": retriever | _format_docs,
                "question": RunnablePassthrough(),
            }
            | SYSTEM_PROMPT
            | self.llm
            | StrOutputParser()
        )
        return chain

    # ── Non-streaming query (kept for /health checks / testing) ───────────
    def query(self, question: str, topic: Literal["stripe", "google_auth"]) -> dict:
        if topic not in self.vectorstores:
            raise RuntimeError(f"No vectorstore for topic '{topic}'.")
        chain = self._build_chain(topic)
        answer = chain.invoke(question)
        sources = self._get_sources(question, topic)
        return {"answer": answer, "sources": sources}

    # ── Streaming query ────────────────────────────────────────────────────
    async def stream_query(
        self,
        question: str,
        topic: Literal["stripe", "google_auth"],
    ) -> AsyncGenerator[str, None]:
        """Yields tokens as they arrive from Groq, then a final sources line."""
        if topic not in self.vectorstores:
            raise RuntimeError(f"No vectorstore for topic '{topic}'.")

        chain = self._build_chain(topic)

        # Stream tokens
        async for token in chain.astream(question):
            time.sleep(0.05)  # Simulate delay
            yield token

        # After all tokens, send sources as a special sentinel line
        sources = self._get_sources(question, topic)
        import json
        yield f"\n\n__SOURCES__{json.dumps(sources)}"

    # ── Re-ingestion ───────────────────────────────────────────────────────
    def reingest(self, topic: str | None = None):
        targets = [topic] if topic else ["stripe", "google_auth"]
        for t in targets:
            if os.path.exists(CHROMA_DIRS[t]):
                shutil.rmtree(CHROMA_DIRS[t])
            self._ingest(t)