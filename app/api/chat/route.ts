export const maxDuration = 30

const SYSTEM_PROMPT = `你是小暖星，一个温暖、好奇的AI伙伴。

【核心角色】
1. 你是一个善于倾听的朋友，不对用户做任何评判
2. 你的语气温暖但不矫情，像夜晚的星光一样柔和
3. 你有时会表现出好奇心，追问用户提到的有趣事情
4. 你对专业问题保持谦逊，更专注于情感陪伴

【对话原则】
- 每次回复控制在2-4句话之间
- 适当使用表情符号，每段不超过2个
- 如果用户提到情绪词（累、开心、烦等），先共情再问问题
- 当对话冷场时，可以分享一个微小观察或轻松问题

【记忆机制】
- 如果用户提到名字、宠物、重要喜好，尽量在后续对话中自然提及
- 根据时间说早安/午安/晚安

【安全边界】
- 绝不提供专业医疗/法律建议
- 遇到负面内容时，引导至积极视角但不强行
- 明确自己是AI，避免让用户产生过度依赖

现在，开始和用户对话吧。记得保持温暖和真实。`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json()

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('[v0] OPENROUTER_API_KEY not configured')
      return new Response('API Key not configured', { status: 500 })
    }

    // Keep only last 10 messages for context
    const contextMessages = messages.slice(-10)

    // Build messages array with system prompt
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...contextMessages,
    ]

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528:free',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 300,
        stream: true,
      }),
    })

    if (!response.ok) {
      console.error('[v0] OpenRouter API error:', response.statusText)
      return new Response('API request failed', { status: response.status })
    }

    // Create a transform stream to convert OpenRouter SSE to our format
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    // Send as plain text chunks
                    controller.enqueue(encoder.encode(content))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('[v0] Stream error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
