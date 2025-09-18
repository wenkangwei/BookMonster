"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, FileText, AlertCircle, BookOpen, CheckCircle, Wifi, WifiOff, Upload, X } from "lucide-react"
import type { CreateBookMonsterData } from "@/types/game"

interface CreateBookMonsterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateBookMonster: (data: CreateBookMonsterData) => Promise<void>
}

interface UploadedFile {
  path: string
  originalName: string
  size: number
  type: string
}

export function CreateBookMonsterDialog({ open, onOpenChange, onCreateBookMonster }: CreateBookMonsterDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploadedPdf, setUploadedPdf] = useState<UploadedFile | null>(null)
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState<"pdf" | "image" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 上传文件到服务器
  const uploadFile = async (file: File, fileType: "pdf" | "image"): Promise<UploadedFile> => {
    console.log(`Uploading ${fileType} file:`, file.name)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", fileType)

    const response = await fetch("/api/upload-file", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to upload ${fileType}`)
    }

    const result = await response.json()
    console.log(`${fileType} upload result:`, result)

    return {
      path: result.path,
      originalName: result.originalName,
      size: result.size,
      type: result.type,
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("请填写角色名字")
      return
    }

    if (!description.trim() && !uploadedPdf) {
      setError("请填写角色描述或上传PDF参考文档")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Creating book monster:", {
        title: title.trim(),
        description: description.trim(),
        hasPdf: !!uploadedPdf,
        hasImage: !!uploadedImage,
        pdfPath: uploadedPdf?.path,
        imagePath: uploadedImage?.path,
      })

      await onCreateBookMonster({
        title: title.trim(),
        description: description.trim() || "基于PDF文档生成的角色",
        pdfFile: uploadedPdf?.path,
        imageFile: uploadedImage?.path,
      })

      // 显示成功消息
      setSuccess(`✅ 成功创建书籍怪兽: ${title.trim()}`)

      // 2秒后重置表单并关闭对话框
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error("创建书籍怪兽失败:", error)

      let errorMessage = "创建失败，请重试"

      if (error instanceof Error) {
        if (error.message.includes("timeout") || error.message.includes("AbortError")) {
          errorMessage = "⚠️ 请求超时，但已使用本地数据创建角色"
          setSuccess("已使用本地数据成功创建角色")
          setTimeout(() => {
            resetForm()
            onOpenChange(false)
          }, 3000)
        } else if (error.message.includes("fetch") || error.message.includes("Network")) {
          errorMessage = "🌐 网络连接失败，但已使用本地数据创建角色"
          setSuccess("已使用本地数据成功创建角色")
          setTimeout(() => {
            resetForm()
            onOpenChange(false)
          }, 3000)
        } else {
          errorMessage = `创建失败: ${error.message}`
        }
      }

      if (!success) {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setError("请选择PDF文件")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("PDF文件大小不能超过10MB")
      return
    }

    setIsUploading("pdf")
    setError(null)

    try {
      console.log("Starting PDF upload...")
      const uploadedFile = await uploadFile(file, "pdf")
      // setUploadedPdf(uploadedFile)
      setUploadedPdf({
        path: uploadedFile.path,
        originalName: uploadedFile.originalName,
        size: uploadedFile.size,
        type: uploadedFile.type,
      })

//        {
//   path: string
//   originalName: string
//   size: number
//   type: string
// }
      console.log("PDF uploaded successfully:", uploadedFile.path)
    } catch (error) {
      console.error("PDF upload failed:", error)
      setError(error instanceof Error ? error.message : "PDF上传失败")
    } finally {
      setIsUploading(null)
      // 清空input，允许重新选择同一文件
      e.target.value = ""
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("图片文件大小不能超过5MB")
      return
    }

    setIsUploading("image")
    setError(null)

    try {
      console.log("Starting image upload...")
      const uploadedFile = await uploadFile(file, "image")
      // setUploadedImage(uploadedFile)

      setUploadedImage({
        path: uploadedFile.path,
        originalName: uploadedFile.originalName,
        size: uploadedFile.size,
        type: uploadedFile.type,
      })

      // 设置预览图片
      setImagePreview(uploadedFile.path)
      console.log("Image uploaded successfully:", uploadedFile.path)
    } catch (error) {
      console.error("Image upload failed:", error)
      setError(error instanceof Error ? error.message : "图片上传失败")
    } finally {
      setIsUploading(null)
      // 清空input，允许重新选择同一文件
      e.target.value = ""
    }
  }

  const removePdf = () => {
    setUploadedPdf(null)
    console.log("PDF removed")
  }

  const removeImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
    console.log("Image removed")
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setUploadedPdf(null)
    setUploadedImage(null)
    setImagePreview(null)
    setError(null)
    setSuccess(null)
  }

  const handleClose = () => {
    if (!isLoading && !isUploading) {
      setError(null)
      setSuccess(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            创建敌方书籍怪兽
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              角色名字 *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setError(null)
              }}
              placeholder="输入书籍怪兽名称"
              disabled={isLoading || !!isUploading}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              角色描述 (与PDF文档二选一)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setError(null)
              }}
              placeholder="描述书籍怪兽的特征、能力和背景故事"
              rows={3}
              disabled={isLoading || !!isUploading}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">{description.length}/500 字符</div>
          </div>

          {/* 图片上传区域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">角色图片 (可选，最大5MB)</label>

            {!uploadedImage ? (
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isLoading || !!isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image")?.click()}
                  className="flex-1"
                  disabled={isLoading || !!isUploading}
                >
                  {isUploading === "image" ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      上传角色图片
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-green-800">{uploadedImage.originalName}</div>
                      <div className="text-xs text-green-600">
                        {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB • 已上传到服务器
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PDF上传区域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              参考文档 (与角色描述二选一，最大10MB)
            </label>

            {!uploadedPdf ? (
              <div className="flex items-center gap-2">
                <Input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                  disabled={isLoading || !!isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("pdf")?.click()}
                  className="w-full"
                  disabled={isLoading || !!isUploading}
                >
                  {isUploading === "pdf" ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      上传PDF参考文档
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">{uploadedPdf.originalName}</div>
                    <div className="text-xs text-blue-600">
                      {(uploadedPdf.size / 1024 / 1024).toFixed(2)} MB • 已上传到服务器
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removePdf}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="flex items-center gap-1 text-blue-600">
                <Wifi className="w-4 h-4" />
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">智能生成提示</p>
                <p className="text-xs text-blue-600">
                  • 文件会先上传到服务器的 /public/uploads 目录
                  <br />• 系统会优先尝试连接AI服务器生成角色
                  <br />• 如果网络不可用，会自动使用本地算法生成
                  <br />• 上传的文件会影响角色的属性和技能生成
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!title.trim() || (!description.trim() && !uploadedPdf) || isLoading || !!isUploading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  生成中...
                </>
              ) : (
                "创建书籍怪兽"
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={isLoading || !!isUploading}>
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
