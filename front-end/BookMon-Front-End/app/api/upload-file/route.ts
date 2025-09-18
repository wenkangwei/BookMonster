import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    console.log("=== File Upload API Called ===")

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const fileType = formData.get("type") as string // "pdf" | "image"

    if (!file) {
      console.error("No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("Uploading file:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      fileType: fileType,
    })

    // 验证文件类型
    if (fileType === "pdf" && file.type !== "application/pdf") {
      console.error("Invalid PDF file type:", file.type)
      return NextResponse.json({ error: "Invalid PDF file type" }, { status: 400 })
    }

    if (fileType === "image" && !file.type.startsWith("image/")) {
      console.error("Invalid image file type:", file.type)
      return NextResponse.json({ error: "Invalid image file type" }, { status: 400 })
    }

    // 验证文件大小
    const maxSize = fileType === "pdf" ? 10 * 1024 * 1024 : 5 * 1024 * 1024 // PDF: 10MB, Image: 5MB
    if (file.size > maxSize) {
      console.error("File too large:", file.size, "Max:", maxSize)
      return NextResponse.json({ error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` }, { status: 400 })
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadDir)) {
      console.log("Creating upload directory:", uploadDir)
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileExtension = path.extname(file.name)
    const fileName = file.name 
    //  `${fileType}_${timestamp}_${randomId}${fileExtension}`
    const filePath = path.join(uploadDir, fileName)

    console.log("Saving file to:", filePath)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 返回相对路径（用于前端访问）
    const relativePath = filePath //`/uploads/${fileName}`

    console.log("File uploaded successfully:", {
      originalName: file.name,
      savedAs: fileName,
      path: relativePath,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    })

    return NextResponse.json({
      success: true,
      path: relativePath,
      originalName: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      {
        error: "File upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
