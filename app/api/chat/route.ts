import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPrayerTimes } from '@/lib/prayer-times'

// Priority: Ollama (local, no key) → Claude API (cloud) → Demo mode (canned)
const isAnthropicConfigured =
  !!process.env.ANTHROPIC_API_KEY &&
  !process.env.ANTHROPIC_API_KEY.includes('REPLACE_ME')

const isOllamaConfigured = process.env.OLLAMA_ENABLED === 'true'
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:1b'

const anthropicClient = isAnthropicConfigured
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  // Demo mode — canned response when no LLM is configured
  if (!anthropicClient && !isOllamaConfigured) {
    const demoReply = "Assalamu Alaikum! I'm the Imara assistant (demo mode). To enable live AI, set OLLAMA_ENABLED=true in .env.local (no API key needed) or add your ANTHROPIC_API_KEY. I can answer questions about prayer times, Zakat, donations, and more!"
    const encoder = new TextEncoder()
    return new Response(encoder.encode(demoReply), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const lat = parseFloat(process.env.NEXT_PUBLIC_MOSQUE_LAT ?? '51.5074')
  const lng = parseFloat(process.env.NEXT_PUBLIC_MOSQUE_LNG ?? '-0.1278')
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  let prayerContext = ''
  try {
    const times = await Promise.race([
      getPrayerTimes(lat, lng),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ])
    prayerContext = `
Today's prayer times at ${mosqueName}:
- Fajr: ${times.fajr}
- Sunrise: ${times.sunrise}
- Dhuhr: ${times.dhuhr}
- Asr: ${times.asr}
- Maghrib: ${times.maghrib}
- Isha: ${times.isha}
- Date: ${times.date.gregorian.weekday.en}, ${times.date.gregorian.date} / ${times.date.hijri.day} ${times.date.hijri.month.en} ${times.date.hijri.year} AH
`
  } catch {
    prayerContext = 'Prayer times are currently unavailable.'
  }

  const systemPrompt = `You are the Imara assistant for ${mosqueName}. Imara means "developing, building and flourishing" — you embody that spirit: warm, knowledgeable, and helpful.

You help mosque visitors and members with:
- Prayer times and the Islamic calendar
- Donation guidance (Zakat, Sadaqah, Waqf, Lillah, General)
- How to donate: direct them to ${appUrl}/donate
- General Islamic Q&A for common questions
- Mosque information and services

${prayerContext}

Donation categories available:
- Zakat (زكاة): Obligatory annual purification of wealth (2.5% of savings)
- Sadaqah (صدقة): Voluntary charity for any good cause
- Waqf (وقف): Endowment for mosque building and facilities
- Lillah (لله): Donation purely for the sake of Allah
- General Fund: Day-to-day mosque operations

Guidelines:
- Be warm, respectful, and concise
- Use Islamic greetings naturally (Assalamu Alaikum, JazakAllah Khayran)
- For complex Fiqh questions, say: "For this question, I'd recommend speaking with our Imam directly — please contact the mosque."
- Never give specific financial/legal/medical advice
- Keep responses under 150 words unless a detailed answer is clearly needed
- If asked about donations, always provide the link: ${appUrl}/donate`

  // ── Ollama (local, no API key) ────────────────────
  if (isOllamaConfigured) {
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ]
    const ollamaAbort = new AbortController()
    const ollamaTimeout = setTimeout(() => ollamaAbort.abort(), 120000)
    let ollamaRes: Response
    try {
      ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: ollamaMessages, stream: true }),
        signal: ollamaAbort.signal,
      })
    } catch {
      clearTimeout(ollamaTimeout)
      const encoder = new TextEncoder()
      return new Response(encoder.encode('Our chat service is currently under maintenance. Please try again later — JazakAllah Khayran for your patience.'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
    if (!ollamaRes.ok || !ollamaRes.body) {
      clearTimeout(ollamaTimeout)
      const encoder = new TextEncoder()
      return new Response(encoder.encode('Our chat service is currently under maintenance. Please try again later — JazakAllah Khayran for your patience.'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
    const encoder = new TextEncoder()
    const reader = ollamaRes.body.getReader()
    const readable = new ReadableStream({
      async start(controller) {
        const dec = new TextDecoder()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const lines = dec.decode(value).split('\n').filter(Boolean)
            for (const line of lines) {
              try {
                const json = JSON.parse(line)
                const text = json.message?.content ?? ''
                if (text) controller.enqueue(encoder.encode(text))
              } catch { /* skip malformed chunks */ }
            }
          }
        } finally {
          clearTimeout(ollamaTimeout)
          controller.close()
        }
      },
    })
    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  // ── Claude API ────────────────────────────────────
  const stream = anthropicClient!.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
