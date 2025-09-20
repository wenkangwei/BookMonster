import { type NextRequest, NextResponse } from "next/server"
import type { EnemyActionRequest, EnemyActionResponse } from "@/types/game"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Enemy Action API Called ===")
    const body = await request.json()
    console.log("Request body:", body)

    const { monster_id, current_hp, health_state, player_monster_id, player_hp, player_state, player_win } =
      body as EnemyActionRequest

    // 尝试调用后端API
    try {
      console.log("Attempting to call backend API at http://localhost:8004/enemy_action")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 8秒超时

      const response = await fetch("http://localhost:8004/enemy_action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monster_id,
          current_hp,
          health_state,
          player_monster_id,
          player_hp,
          player_state,
          player_win,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Backend API Error:", errorText)
        throw new Error(`Backend API returned ${response.status}: ${errorText}`)
      }

      const backendData: EnemyActionResponse = await response.json()
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

      // 使用本地后备问题
      console.log("Using local fallback questions...")
      const fallbackQuestions: EnemyActionResponse[] = [
        {
      tools:{
          question: ["q_fallback_1", "如何应对火焰攻击？", "25"],
          answer1: "使用水系技能",
          answer2: "使用草系技能",
          answer3: "使用电系技能",
          answer4: "使用地面系技能",
          correct_answer: "1",
        },
      reply: "准备好，问题来咯",
    },

        {
      tools:{
          question: ["q_fallback_2", "面对强力物理攻击时应该？", "30"],
          answer1: "提高防御力",
          answer2: "使用反击技能",
          answer3: "进行闪避",
          answer4: "使用治疗技能",
          correct_answer: "1",
        },
      reply: "准备好，问题来咯",
    },


    {
      tools:{
          question: ["q_fallback_3", "如何对付飞行中的敌人？", "35"],
          answer1: "使用地面系技能",
          answer2: "使用电系技能",
          answer3: "使用岩石系技能",
          answer4: "使用冰系技能",
          correct_answer: "2",
        },
      reply: "准备好，问题来咯",
    },

    {
      tools:{
          question: ["q_fallback_4", "遇到毒系攻击时应该？", "20"],
          answer1: "使用解毒剂",
          answer2: "使用钢系技能",
          answer3: "使用超能力技能",
          answer4: "使用地面系技能",
          correct_answer: "2",
        },
      reply: "准备好，问题来咯",
    }
        
        
        
        
      ]

      const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]
      console.log("Using fallback question:", randomQuestion)

      return NextResponse.json(randomQuestion)
    }
  } catch (error) {
    console.error("Error in enemy-action route:", error)

    // 最终后备方案
    // const emergencyQuestion: EnemyActionResponse = {
    //   question: ["q_emergency", "如何应对这个攻击？", "25"],
    //   answer1: "防御",
    //   answer2: "闪避",
    //   answer3: "反击",
    //   answer4: "治疗",
    //   correct_answer: "1",
    // }
    const emergencyQuestion: EnemyActionResponse = {
      tools: {
        question: ["q_emergency", "如何应对这个攻击？", "25"],
        answer1: "防御",
        answer2: "闪避",
        answer3: "反击",
        answer4: "治疗",
        correct_answer: "1",
      },
      reply: "请选择正确的应对方式：",
    }
   

    return NextResponse.json(emergencyQuestion)
  }
}
