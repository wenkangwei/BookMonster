import type {
  InitMonsterResponse,
  GenerateBookMonsterRequest,
  GenerateBookMonsterResponse,
  EnemyActionRequest,
  EnemyActionResponse,
  BackendMonsterState,
  BookMonster,
  CreateBookMonsterData,
} from "@/types/game"

// API错误处理
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// 通用请求函数 - 调用Next.js API路由
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, timeout = 1000000): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    console.log(`Making API request to: ${endpoint}`)
    console.log("Request options:", { ...options, body: options.body ? "..." : undefined })

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error for ${endpoint}:`, errorText)
      throw new ApiError(`API Error: ${response.status}`, response.status, errorText)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const result = await response.json()
      console.log(`API Response for ${endpoint}:`, result)
      return result
    } else {
      throw new ApiError("Invalid response format: expected JSON")
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === "AbortError") {
      console.error(`Request timeout for ${endpoint}`)
      throw new ApiError("Request timeout")
    }

    if (error instanceof ApiError) {
      throw error
    }

    console.error(`Network error for ${endpoint}:`, error.message)
    throw new ApiError(`Network error: ${error.message}`)
  }
}

// 文件处理函数 - 不上传到服务器，直接转换为base64或生成本地路径
async function processFile(file: File, type: "pdf" | "image"): Promise<string> {
  try {
    console.log(`Processing ${type} file:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    if (type === "image") {
      // 对于图片，转换为base64用于预览
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          resolve(result)
        }
        reader.onerror = () => reject(new Error("Failed to read image file"))
        reader.readAsDataURL(file)
      })
    } else {
      // 对于PDF，生成一个本地引用路径
      const timestamp = Date.now()
      const fileName = `${type}_${timestamp}_${file.name}`
      console.log(`Generated local reference for PDF: ${fileName}`)
      return `/local/${fileName}`
    }
  } catch (error) {
    console.error("File processing failed:", error)
    // 返回占位符路径
    const timestamp = Date.now()
    return `/placeholder/${type}_${timestamp}.${file.name.split(".").pop()}`
  }
}

// 转换后端数据为前端BookMonster格式
export function convertBackendToBookMonster(backend: BackendMonsterState, isPlayerOwned = false): BookMonster {
  return {
    id: `bookmonster_${backend.monster_id}`,
    name: backend.monster_name,
    level: backend.level,
    hp: backend.currentHp,
    maxHp: backend.maxHp,
    image: backend.monster_image,
    skills: [], // 技能将在对战时动态获取
    description: `${backend.attribute}属性的书籍怪兽，来自《${backend.book_name}》`,
    stats: {
      attack: backend.attack,
      defense: backend.defense,
      speed: backend.speed,
      hp: backend.maxHp,
      special: Math.floor((backend.attack + backend.defense) / 2),
      accuracy: 85,
    },
    isPlayerOwned,
    monsterId: backend.monster_id,
    attribute: backend.attribute,
    bookName: backend.book_name,
    bookId: backend.book_id,
    exp: backend.exp,
    attack: backend.attack,
    defense: backend.defense,
    speed: backend.speed,
    healthState:
      backend.currentHp > backend.maxHp * 0.7 ? "健康" : backend.currentHp > backend.maxHp * 0.3 ? "受伤" : "濒死",
  }
}

// API服务类
export class GameApiService {
  // 1. 初始化用户选择角色
  static async initMonster(): Promise<BookMonster[]> {
    try {
      console.log("=== GameApiService.initMonster ===")
      const response = await apiRequest<InitMonsterResponse>("/init-monster", {
        method: "POST",
        body: JSON.stringify({}),
      })

      console.log("Init monster service response:", response)
      return response.monster.map((monster) => convertBackendToBookMonster(monster, true))
    } catch (error) {
      console.error("Init monster service failed:", error)
      throw error
    }
  }

  // 2. 生成对方角色
  static async generateBookMonster(data: CreateBookMonsterData): Promise<BookMonster> {
    try {
      console.log("=== GameApiService.generateBookMonster ===")
      console.log("Generating book monster:", data.title)

      // 处理文件（不上传到服务器）
      let pdfPath = ""
      let imagePath = ""

      if (data.pdfFile) {
        // // 发送处理文件
        // pdfPath = await processFile(data.pdfFile, "pdf")
        pdfPath = data.pdfFile
        console.log("PDF processed:", pdfPath)
      }

      if (data.imageFile) {
        // // 发送处理文件
        // imagePath = await processFile(data.imageFile, "image")
        imagePath = data.imageFile
        console.log("Image processed:", imagePath)
      }

      // 构建请求，使用本地文件路径或base64
      const request: GenerateBookMonsterRequest = {
        pdf: pdfPath,
        image: imagePath,
        description: data.description,
        title: data.title,
        is_player: false,
      }

      console.log("Calling generate-bookmonster API with:", {
        ...request,
        pdf: pdfPath ? "PDF processed" : "",
        image: imagePath ? "Image processed" : "",
      })

      const response = await apiRequest<GenerateBookMonsterResponse>("/generate-bookmonster", {
        method: "POST",
        body: JSON.stringify(request),
      })

      console.log("Generate book monster service response:", response)
      return convertBackendToBookMonster(response, false)
    } catch (error) {
      console.error("Generate book monster service failed:", error)
      throw error
    }
  }

  // 3. 角色对战
  static async enemyAction(request: EnemyActionRequest): Promise<EnemyActionResponse> {
    try {
      console.log("=== GameApiService.enemyAction ===")
      console.log("Enemy action request:", request)

      const response = await apiRequest<EnemyActionResponse>("/enemy-action", {
        method: "POST",
        body: JSON.stringify(request),
      })

      console.log("Enemy action service response:", response)
      return response
    } catch (error) {
      console.error("Enemy action service failed:", error)
      throw error
    }
  }
}
