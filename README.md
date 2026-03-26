
https://github.com/user-attachments/assets/f4f87e8f-5858-4040-93f3-ee0ad4f13ae3
# LangChain Agent (Coding Agent)

A RAG-powered documentation chatbot that provides accurate, sourced answers about Stripe and Google Auth integrations. Built with FastAPI backend and React frontend.

![Project Banner](https://via.placeholder.com/800x200/0f0f17/ffffff?text=LangChain+Agent+-+DocBot)


Project Demo: Uploading Screencast from 03-26-2026 06-54-15 PM.mp4…

## 🚀 Features

- **Official Documentation Only**: Scrapes and indexes real Stripe and Google Auth docs to prevent hallucinations
- **Topic Isolation**: Separate vectorstores for Stripe and Google Auth prevent cross-contamination
- **Source Attribution**: Every answer includes clickable links to source documentation
- **Code Generation**: Produces copy-paste-ready code with best practices
- **Beautiful UI**: Dark theme with glassmorphism effects, animations, and responsive design
- **Real-time Chat**: Streaming responses with markdown rendering and syntax highlighting
- **Persistent Storage**: Local ChromaDB vectorstore for fast startup
- **Reingest Capability**: API endpoint to rebuild documentation index

## 🛠️ Technology Stack

### Backend
- **FastAPI**: High-performance async web framework
- **LangChain**: RAG orchestration and chain management
- **ChromaDB**: Persistent vector database for embeddings
- **HuggingFace Embeddings**: Document vectorization (all-MiniLM-L6-v2)
- **Groq API**: LLM for answer generation (llama-3.1-8b-instant)
- **BeautifulSoup4**: Web scraping for documentation ingestion

### Frontend
- **React 19**: Modern UI framework with hooks
- **Vite**: Fast build tool and dev server
- **React Markdown**: Rich text rendering
- **React Syntax Highlighter**: Code block formatting
- **CSS Custom Properties**: Dark theme design system

## 📁 Project Structure

```
langchainAgent/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI app with API routes
│   ├── rag_engine.py       # RAG orchestration and vectorstore management
│   ├── urls.py             # Documentation URLs for scraping
│   ├── requirements.txt    # Python dependencies
│   ├── pyproject.toml      # Project configuration
│   ├── chroma_db/          # Persistent vectorstore
│   │   ├── stripe/         # Stripe documentation embeddings
│   │   └── google_auth/    # Google Auth documentation embeddings
│   └── README.md
│
└── frontend/               # React + Vite frontend
    ├── src/
    │   ├── App.jsx         # Main UI with integration buttons
    │   ├── index.css       # Styling and design system
    │   ├── main.jsx        # React entry point
    │   └── components/
    │       ├── ChatBox.jsx        # Chat interface modal
    │       └── MessageBubble.jsx  # Message rendering component
    ├── package.json        # Frontend dependencies
    ├── vite.config.js      # Vite configuration
    ├── index.html          # HTML template
    └── README.md
```

## 🏁 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Backend Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   # or with uv
   uv pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the backend:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 📖 Usage

### Web Interface
1. Choose between **Stripe** or **Google Auth** integration
2. Click on suggested prompts or type your own question
3. Get AI-generated answers with source links and code examples

### API Usage

#### Chat Endpoint
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I accept a payment with Stripe?",
    "topic": "stripe"
  }'
```

**Response:**
```json
{
  "answer": "To accept a payment with Stripe...\n\n1. Install the SDK\n```python\npip install stripe\n```\n\n2. Create a PaymentIntent...",
  "sources": [
    "https://docs.stripe.com/payments/accept-a-payment",
    "https://docs.stripe.com/get-started"
  ]
}
```

#### Health Check
```bash
curl http://localhost:8000/health
```

#### Reingest Documentation
```bash
curl -X POST http://localhost:8000/reingest
```

## 🔧 API Reference

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/` | GET | Health check | - | `{status, message}` |
| `/health` | GET | RAG engine status | - | `{status, message}` |
| `/chat` | POST | Query RAG engine | `{message, topic}` | `{answer, sources}` |
| `/reingest` | POST | Rebuild vectorstores | - | `{status, message}` |

### Request/Response Schemas

**Chat Request:**
```typescript
{
  message: string;  // User's question
  topic: "stripe" | "google_auth" | "all";  // Documentation topic
}
```

**Chat Response:**
```typescript
{
  answer: string;    // AI-generated answer with markdown
  sources: string[]; // Array of source documentation URLs
}
```

## 🎨 Design System

### Color Palette
- **Background**: `#0f0f17` (dark charcoal)
- **Surface**: `#21212d` (elevated surfaces)
- **Text**: `#e8e8f0` (primary text)
- **Muted**: `#6b6b80` (secondary text)
- **Stripe**: `#635bff` (Stripe brand color)
- **Google**: `#4285f4` (Google brand color)
- **Accent**: `#a0f0c0` (success/mint)

### Typography
- **Headings**: Syne (geometric sans-serif)
- **Body**: System font stack
- **Code**: JetBrains Mono

## 📚 Documentation Sources

### Stripe (90+ URLs)
- Payment processing (Payment Intents, Elements, Checkout)
- Subscriptions and billing
- Account management and teams
- Terminal and in-person payments
- Mobile payments
- Webhooks and events

### Google Auth (5 URLs)
- OAuth 2.0 protocol overview
- Google Sign-In integration
- Web server authentication flow
- API client ID setup
- JavaScript reference

## 🔄 How It Works

1. **Ingestion**: WebBaseLoader scrapes official documentation
2. **Chunking**: Documents split into 500-character chunks
3. **Embedding**: HuggingFace model converts text to vectors
4. **Storage**: ChromaDB persists embeddings in topic-isolated stores
5. **Query**: User question → retrieve relevant chunks → generate answer
6. **Response**: AI answer with source attribution and code examples

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stripe** for comprehensive documentation
- **Google** for OAuth documentation
- **LangChain** for RAG framework
- **ChromaDB** for vector storage
- **Groq** for fast LLM inference

---

**Built with ❤️ for developers who need accurate integration guidance**
