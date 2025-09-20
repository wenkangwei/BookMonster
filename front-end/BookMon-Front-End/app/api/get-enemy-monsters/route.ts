import { type NextRequest, NextResponse } from "next/server"
import type { InitMonsterResponse, BackendMonsterState } from "@/types/game"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Init Monster API Called ===")
    const body = await request.json()
    console.log("Request body:", body)

    // 尝试调用后端API
    try {
      console.log("Attempting to call backend API at http://localhost:8004/get_enemy_monster")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      const response = await fetch("http://localhost:8004/get_enemy_monster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Backend API Error:", errorText)
        throw new Error(`Backend API returned ${response.status}: ${errorText}`)
      }

      const backendData: InitMonsterResponse = await response.json()
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

      // 使用本地后备数据
      console.log("Getting fallback starter monsters...")
      const fallbackMonsters: BackendMonsterState[] = []
    //   const fallbackMonsters: BackendMonsterState[] = [
    //     {
    //       monster_id: 1,
    //       monster_name: "火焰书灵",
    //       monster_image: "/fire-book-monster.jpg",
    //       attribute: "火",
    //       book_name: "火焰魔法书",
    //       book_id: "book_fire_001",
    //       level: 5,
    //       exp: 0,
    //       maxHp: 39,
    //       currentHp: 39,
    //       attack: 52,
    //       defense: 43,
    //       speed: 65,
    //       skills: [
    //         {
    //           question: ["q_fire_1", "如何应对水系攻击？", "25"],
    //           answer1: "使用火系技能",
    //           answer2: "提高防御",
    //           answer3: "使用闪避",
    //           answer4: "使用治疗",
    //           correct_answer: "2",
    //         },
    //       ],
    //     },
    //     {
    //       monster_id: 2,
    //       monster_name: "水流书灵",
    //       monster_image: "/water-book-monster.jpg",
    //       attribute: "水",
    //       book_name: "水流魔法书",
    //       book_id: "book_water_001",
    //       level: 5,
    //       exp: 0,
    //       maxHp: 44,
    //       currentHp: 44,
    //       attack: 48,
    //       defense: 65,
    //       speed: 43,
    //       skills: [
    //         {
    //           question: ["q_water_1", "面对火系攻击时应该？", "30"],
    //           answer1: "使用水系技能",
    //           answer2: "使用防御技能",
    //           answer3: "进行闪避",
    //           answer4: "使用治疗",
    //           correct_answer: "1",
    //         },
    //       ],
    //     },
    //     {
    //       monster_id: 3,
    //       monster_name: "自然书灵",
    //       monster_image: "/nature-book-monster.jpg",
    //       attribute: "草",
    //       book_name: "自然魔法书",
    //       book_id: "book_nature_001",
    //       level: 5,
    //       exp: 0,
    //       maxHp: 45,
    //       currentHp: 45,
    //       attack: 49,
    //       defense: 49,
    //       speed: 45,
    //       skills: [
    //         {
    //           question: ["q_nature_1", "如何对付飞行系敌人？", "35"],
    //           answer1: "使用地面系技能",
    //           answer2: "使用草系技能",
    //           answer3: "使用岩石系技能",
    //           answer4: "使用冰系技能",
    //           correct_answer: "3",
    //         },
    //       ],
    //     },
    //   ]

      const fallbackResponse: InitMonsterResponse = {
        monster: fallbackMonsters,
      }

      console.log("Using fallback starter monsters:", fallbackResponse)
      return NextResponse.json(fallbackResponse)
    }
  } catch (error) {
    console.error("Error in init-monster route:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize monsters",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
