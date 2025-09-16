import { type NextRequest, NextResponse } from "next/server"
import type { GenerateBookMonsterRequest, GenerateBookMonsterResponse, BackendMonsterState } from "@/types/game"

// 简单的伪随机数生成器，基于种子
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 基于字符串生成种子
function stringToSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// 生成后备书籍怪兽数据
function generateFallbackBookMonster(title: string, description: string): BackendMonsterState {
  const seed = stringToSeed(title)
  const attributes = ["火", "水", "草", "电", "地面", "飞行", "钢", "超能力", "岩石", "冰"]
  const attribute = attributes[Math.floor(seededRandom(seed) * attributes.length)]

  const level = Math.floor(seededRandom(seed + 1) * 20) + 10
  const baseHp = Math.floor(seededRandom(seed + 2) * 50) + 80
  const attack = Math.floor(seededRandom(seed + 3) * 30) + 40
  const defense = Math.floor(seededRandom(seed + 4) * 30) + 40
  const speed = Math.floor(seededRandom(seed + 5) * 30) + 40

  return {
    monster_id: Date.now(),
    monster_name: title,
    monster_image: `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(title + " book monster")}`,
    attribute,
    book_name: title,
    book_id: `book_${Date.now()}`,
    level,
    exp: 0,
    maxHp: baseHp,
    currentHp: baseHp,
    attack,
    defense,
    speed,
    skills: [
      {
        question: [`q_${Date.now()}_1`, `如何应对${attribute}系攻击？`, "25"],
        answer1: "使用克制属性",
        answer2: "提高防御力",
        answer3: "进行闪避",
        answer4: "使用治疗技能",
        correct_answer: "1",
      },
      {
        question: [`q_${Date.now()}_2`, "面对强力物理攻击时应该？", "30"],
        answer1: "提高防御力",
        answer2: "使用反击技能",
        answer3: "进行闪避",
        answer4: "使用治疗技能",
        correct_answer: "1",
      },
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Generate BookMonster API Called ===")
    const body = await request.json()
    console.log("Request body:", body)

    const { title, description, pdf, image, is_player } = body as GenerateBookMonsterRequest

    // 尝试调用后端API
    try {
      console.log("Attempting to call backend API at http://localhost:8004/generate_bookmonster")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒超时

      const response = await fetch("http://localhost:8004/generate_bookmonster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          pdf: pdf || "",
          image: image || "",
          is_player,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Backend API Error:", errorText)
        throw new Error(`Backend API returned ${response.status}: ${errorText}`)
      }

      const backendData: GenerateBookMonsterResponse = await response.json()
      console.log("Backend API Response:", backendData)

      return NextResponse.json(backendData)
    } catch (error) {
      console.error("Backend API call failed:", error)

      // 网络错误处理
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.log("Network error detected, using local fallback")
      } else if (error.name === "AbortError") {
        console.log("Request timeout, using local fallback")
      } else {
        console.log("Other backend error, using local fallback:", error.message)
      }

      // 使用本地后备数据生成
      console.log("Generating fallback book monster locally...")
      const fallbackMonster = generateFallbackBookMonster(title, description)

      console.log("Generated fallback book monster:", fallbackMonster.monster_name)
      return NextResponse.json(fallbackMonster)
    }
  } catch (error) {
    console.error("Error in generate-bookmonster route:", error)

    // 最终后备方案
    const emergencyMonster = generateFallbackBookMonster("神秘书籍怪兽", "一只神秘的书籍怪兽")

    return NextResponse.json(emergencyMonster)
  }
}
