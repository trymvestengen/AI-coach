# Coach-tab UX — Design Spec

**Status:** Draft for review
**Dato:** 2026-05-28
**Forfatter:** Trym (m/ Claude)

## Bakgrunn

Visjon-spec'en ([2026-05-27-product-vision-design.md](./2026-05-27-product-vision-design.md)) definerte coach som den viktigste differensieringen for AI Coach. Memory-arkitekturen ([2026-05-27-memory-architecture-design.md](./2026-05-27-memory-architecture-design.md)) ga coach hukommelse og tool-use. Profile-tab'en ga brukeren mulighet til å fylle Lag 1.

Nå mangler den synlige delen: en chat-grensesnitt som faktisk leverer coach-opplevelsen.

Dagens `/coach`-side er en wrapper rundt `VoiceSession`-komponenten (voice-først). Det matcher ikke den nye visjonen (tekst-først, voice valgfritt). Denne spec'en redesigner Coach-tab fra grunnen.

## Mål

Når denne spec'en er implementert:
- Bruker chatter med coach via tekst som default
- Coach-svar streames inn ord-for-ord (ChatGPT-stil)
- Tool-use vises synlig i meldingsflyten som piller
- Voice-modus er én knapp unna (eksisterende VoiceSession som fullskjerm)
- Samtale-state lagres i `coach_sessions`/`coach_messages` (auto-resume innenfor 30 min)
- Coach kan handle på vegne av brukeren via tools (logge sett, hente historikk, etc.)

## UX-struktur

```
┌──────────────────────────────────┐
│ Coach              [🎤 Voice]  ⋮ │
├──────────────────────────────────┤
│                                  │
│  ┌─────────────────┐             │
│  │ User: hei coach │             │
│  └─────────────────┘             │
│                                  │
│ ┌──────────────────┐             │
│ │ Coach: Hei!...   │             │
│ └──────────────────┘             │
│                                  │
│ ┌─────────────────────────────┐  │
│ │ 🔍 Henter knebøy-historikk  │  │
│ └─────────────────────────────┘  │
│                                  │
│ ┌──────────────────┐             │
│ │ Coach: Du dro... │  ← stream   │
│ └──────────────────┘             │
│                                  │
├──────────────────────────────────┤
│ [skriv en melding...]    [Send]  │
└──────────────────────────────────┘
```

### Header
- Tittel: "Coach"
- 🎤 Voice-toggle (åpner fullskjerm-modal med eksisterende VoiceSession)
- ⋮ Meny: "Ny samtale" (avslutter aktiv session og starter ny på neste melding)

### Meldingsliste
- User-meldinger: høyrejustert, oransje-aksent
- Coach-meldinger: venstrejustert, mørk
- Tool-use-piller: senterjustert badge mellom meldinger
- Auto-scroll til bunnen ved ny melding
- Lastes inn ved sidelast: meldinger fra aktiv session (eller blank hvis ingen)

### Input
- Multiline textarea (vokser opp til 4 linjer)
- Send-knapp (oransje, disabled når tom)
- Enter → send. Shift+Enter → ny linje.

### Voice-modus
- Fullskjerm modal som åpner via 🎤
- Bruker eksisterende `VoiceSession`-komponent
- Lukker → tilbake til chat med meldinger intakt

## Streaming og tool-use

### SSE-protokoll

Backend `/api/chat/stream` returnerer en Server-Sent Events-stream. Events:

```
data: {"type": "session_id", "id": "..."}
data: {"type": "text_delta", "text": "Hei! "}
data: {"type": "tool_use", "name": "get_workout_history", "input": {...}}
data: {"type": "tool_result", "name": "get_workout_history", "ok": true, "summary": "..."}
data: {"type": "text_delta", "text": "Du dro 82.5kg..."}
data: {"type": "done"}
```

Hver `data:` linje er ett JSON-objekt. Frontend åpner stream via `fetch` + `getReader` (ikke EventSource — den støtter ikke POST).

### Tool-use-mapping

| Tool-navn | Pille-tekst |
|---|---|
| `get_user_profile` | 👤 Sjekker profilen din |
| `get_workout_history` | 🔍 Henter treningshistorikk |
| `get_recent_sessions` | 💬 Sjekker tidligere samtaler |
| `get_progression` | 📈 Henter progresjon |
| `search_observations` | 🧠 Søker i tidligere observasjoner |
| `write_observation` | 📝 Noterer observasjon |
| `log_set_with_note` | 💾 Logger sett |
| `log_workout` | 💾 Logger økten |
| `create_program` | 🏋️ Lager program |
| `get_exercise_info` | ℹ️ Slår opp øvelse |
| `search_exercises` | 🔎 Søker etter øvelser |

Pille-states: `running` (pulserende), `done` (✓), `error` (✗). Eksakte stiler i implementeringsplanen.

### Session-management

- Klient kaller `GET /api/chat/sessions/current` ved sidelast
  - 200 + session → bruker den, henter meldinger
  - 404 → ingen aktiv, vises blank chat
- Klient sender første melding → backend ser `session_id == null` ELLER `last_activity_at > 30 min siden` → oppretter ny session
- Hver melding oppdaterer `last_activity_at`
- Bruker velger "Ny samtale" → klient kaller `POST /api/chat/sessions/new` → ny session brukes fra og med neste melding

## Backend-endringer

### Ny: `app/services/coach.py::chat_stream()`

Async generator som yielder dict-events. Tar `user_id`, `session_id` (nullable), `user_message`.

Flow:
1. Slå opp eller opprett session
2. Yield `{"type": "session_id", "id": ...}`
3. Lagre user-melding i `coach_messages`
4. Bygg full melding-historikk for session (system + base context + N siste turns)
5. Kall Anthropic `client.messages.stream(...)` med tools
6. For hver SDK-event:
   - `content_block_delta` med `text_delta` → yield text_delta
   - `content_block_start` med tool_use → akkumulér tool_use, ved blokk-slutt yield tool_use, kjør handler, yield tool_result, gjør nytt non-streaming kall med tool_result, stream det
   - `message_stop` med `end_turn` → yield done
   - Annet → ignorer
7. Lagre assistant-melding (tekst + tool calls) i `coach_messages`
8. Oppdater `last_activity_at` i `coach_sessions`

Eksisterende `chat()` (non-streaming) beholdes for bakoverkompatibilitet.

### Nye routes i `app/routers/chat.py`

```
POST /api/chat/stream
     body: { session_id: string | null, message: string }
     response: StreamingResponse (text/event-stream)

GET  /api/chat/sessions/current
     response: { id: string, last_activity_at: string } | 404

GET  /api/chat/sessions/{id}/messages
     response: [{ id, role, content, created_at }, ...]
     content for user/assistant: { text: "..." }
     content for tool_use: { tool_name: "...", input: {...} }
     content for tool_result: { tool_name: "...", result: {...} }

POST /api/chat/sessions/new
     response: { id: string }
     Marker eksisterende aktive sessions for user som ended_at = now()
     Opprett ny session (eller la første melding gjøre det)
```

### `coach_messages.content` JSONB-struktur

Kilde-til-sannhet for samtale-historikken. Lagres som event-stream rekonstruerbar:

- user: `{"text": "..."}`
- assistant (text-only): `{"text": "..."}`
- tool_use: `{"tool_name": "...", "tool_use_id": "...", "input": {...}}`
- tool_result: `{"tool_use_id": "...", "result": {...}, "ok": bool}`

En coach-tur kan bestå av flere `coach_messages`-rader: én tool_use, én tool_result, evt. mer tool_use, og til slutt assistant text.

## Frontend-komponenter

### Filstruktur

```
web/src/app/coach/
  page.tsx                          # Server-rendered: hent current session + messages
  CoachClient.tsx                   # Hovedchat-komponent
  ChatBody.tsx                      # Scrollable meldingsliste

web/src/components/chat/
  ChatInput.tsx                     # Eksisterende, oppdateres for multiline + Enter-håndtering
  MessageBubble.tsx                 # Eksisterende, beholdes som er
  ToolUsePill.tsx                   # NY: inline pille
  ThinkingDots.tsx                  # NY: pulserende dots mens vi venter

web/src/components/voice/
  VoiceSession.tsx                  # Eksisterende
  VoiceSheet.tsx                    # NY: fullskjerm-dialog som wrapper

web/src/lib/coach-stream.ts         # SSE-klient: fetch + ReadableStream → async generator
```

`web/src/components/chat/ChatWindow.tsx` (eksisterende, 26 linjer) — kan beholdes som intern wrapper i ChatBody, eller fjernes. Implementeringsplanen velger.

### Tilstandshåndtering i CoachClient

```ts
interface Message {
  id: string                     // session-message id (eller midlertidig client-side for streaming)
  role: "user" | "assistant" | "tool_use" | "tool_result"
  content: any                   // formatted per role
  state?: "streaming" | "done" | "error"
}

const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
const [messages, setMessages] = useState<Message[]>(initialMessages)
const [isStreaming, setIsStreaming] = useState(false)
```

Stream-events oppdaterer state:
- `session_id` → setSessionId
- `text_delta` → appender til siste assistant-melding (eller oppretter ny hvis ingen)
- `tool_use` → push tool_use-melding med state=streaming
- `tool_result` → finn forrige tool_use-melding, oppdater state=done eller error
- `done` → setIsStreaming(false), finalize siste assistant-melding

### `coach-stream.ts` skisse

```ts
export interface StreamEvent {
  type: "session_id" | "text_delta" | "tool_use" | "tool_result" | "done" | "error"
  id?: string
  text?: string
  name?: string
  input?: unknown
  ok?: boolean
  summary?: string
  message?: string
}

export async function* chatStream(
  token: string,
  sessionId: string | null,
  message: string,
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ session_id: sessionId, message }),
  })
  if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n\n")
    buffer = lines.pop() ?? ""
    for (const frame of lines) {
      const dataLine = frame.split("\n").find(l => l.startsWith("data:"))
      if (!dataLine) continue
      const json = dataLine.slice(5).trim()
      yield JSON.parse(json) as StreamEvent
    }
  }
}
```

## Test-strategi

### Backend

- `test_chat_stream.py`:
  - chat_stream yielder session_id som første event
  - chat_stream yielder text_delta-events fra mocked Anthropic stream
  - chat_stream yielder tool_use og tool_result når mock-en returnerer tool_use
  - chat_stream yielder done på end_turn
  - Lagring i coach_messages skjer for user, assistant, og tool-events
- `test_chat_router.py`:
  - GET /api/chat/sessions/current returns 200 with session if exists, 404 otherwise
  - POST /api/chat/sessions/new marks active sessions as ended, returns new id
  - GET /api/chat/sessions/{id}/messages returns chronological messages

### Frontend

- `coach-stream.test.ts`: SSE-parser splitter frames korrekt selv med partials
- `ToolUsePill.test.tsx`: rendrer riktig tekst og state-indikator basert på tool-navn
- `ThinkingDots.test.tsx`: smoke-test
- `CoachClient.test.tsx`: integrasjon — render med mock-stream, verifiser state-oppdateringer

## Suksesskriterier

- [ ] Bruker åpner Coach-tab og ser meldinger fra siste session (eller blank hvis ingen)
- [ ] Bruker skriver melding → ser thinking-dots → ser tekst streame inn
- [ ] Når coach kaller tool, ser bruker pille i samtalen med riktig label
- [ ] Etter coach er ferdig, kan bruker skrive ny melding
- [ ] Bruker trykker 🎤 → åpner VoiceSession i fullskjerm-modal
- [ ] Bruker trykker "Ny samtale" → ny session opprettes på neste melding
- [ ] Session resumes automatisk hvis < 30 min siden siste melding
- [ ] Tool-use-piller for alle 11 tools (per mapping-tabell)
- [ ] SSE-stream avsluttes graceful ved nettverksfeil
- [ ] Backend pytest dekker chat_stream-flow
- [ ] Frontend Vitest dekker SSE-parser + ToolUsePill + CoachClient
- [ ] `make check` passerer

## Out of scope

1. Voice-to-text i input-feltet (Deepgram-integrasjon — Phase 2)
2. Proaktive coach-meldinger (krever notification-infra)
3. Multi-conversation sidebar / liste (kun "siste session" i MVP)
4. "Hva husker du om meg?"-visning (Lag 2 forblir usynlig)
5. Stop-knapp midt i streaming
6. Regenerate-meldinger
7. Markdown-rendering i coach-meldinger
8. Long-press meldinger for actions (kopier, slett)
9. Visuell polish / premium feel
10. Persistens på tvers av enheter utover DB-state

## Tekniske risikoer

| Risiko | Avbøtning |
|---|---|
| Vercel/Railway timer ut lange streams | Heartbeat hvert 15s (tom kommentar-frame: `: keep-alive\n\n`) |
| Anthropic SDK streaming endrer seg | Hold abstraksjonen lokal og testbar i `chat_stream()` |
| Tool-use mid-stream kompleksitet | Stream kun tekst i siste `end_turn`-runde. Mellom tool_use og tool_result: ingen text-deltaer streames. |
| SSE-stream fra Vercel frontend til Railway backend | Frontend kaller Railway direkte via `NEXT_PUBLIC_API_URL`. CORS allerede konfigurert. |
| Anthropic API-kostnad øker med flere tool-roundtrips | Akseptert; vi vil ha rik coach-oppførsel |
| coach_messages.content JSONB-format endrer seg | Versjonsfelt på rader hvis det blir behov senere |

## Hva som blir neste spec

Etter at Coach-tab er implementert:

1. **Onboarding-redesign** — inkluder de 4 nye profile-feltene + intro til coach
2. **Logging-flyt redesign** — slå sammen Log + Program (visjonens beslutning)
3. **Visuell design / premium feel** — design-system, farger, typografi
4. **Voice-to-text input** (Phase 2 av Coach-tab) — Deepgram-integrasjon
5. **Proaktive coach-meldinger** — notification-infra
