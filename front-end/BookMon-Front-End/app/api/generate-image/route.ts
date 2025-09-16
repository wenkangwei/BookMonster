import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, pokemonName } = await request.json()

    // 这里调用你的图片生成大模型API
    // 示例：
    // const imageResponse = await fetch('YOUR_IMAGE_AI_API_ENDPOINT', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.IMAGE_AI_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     prompt: `Generate a pokemon image: ${prompt}`,
    //     style: 'pokemon',
    //   })
    // })

    // 模拟返回图片URL
    const imageUrl = `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(pokemonName + " pokemon battle")}`

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
