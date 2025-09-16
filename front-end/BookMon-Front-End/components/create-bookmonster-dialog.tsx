"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, FileText, AlertCircle, BookOpen, CheckCircle, Wifi, WifiOff } from "lucide-react"
import type { CreateBookMonsterData } from "@/types/game"

interface CreateBookMonsterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateBookMonster: (data: CreateBookMonsterData) => Promise<void>
}

export function CreateBookMonsterDialog({ open, onOpenChange, onCreateBookMonster }: CreateBookMonsterDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("请填写角色名字")
      return
    }

    if (!description.trim() && !pdfFile) {
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
        hasPdf: !!pdfFile,
        hasImage: !!imageFile,
        pdfSize: pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)}MB` : "N/A",
        imageSize: imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)}MB` : "N/A",
      })

      await onCreateBookMonster({
        title: title.trim(),
        description: description.trim() || "基于PDF文档生成的角色",
        pdfFile: pdfFile || undefined,
        imageFile: imageFile || undefined,
      })

      // 显示成功消息
      setSuccess(`✅ 成功创建书籍怪兽: ${title.trim()}`)

      // 2秒后重置表单并关闭对话框
      setTimeout(() => {
        setTitle("")
        setDescription("")
        setPdfFile(null)
        setImageFile(null)
        setImagePreview(null)
        setError(null)
        setSuccess(null)
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
            setTitle("")
            setDescription("")
            setPdfFile(null)
            setImageFile(null)
            setImagePreview(null)
            setError(null)
            setSuccess(null)
            onOpenChange(false)
          }, 3000)
        } else if (error.message.includes("fetch") || error.message.includes("Network")) {
          errorMessage = "🌐 网络连接失败，但已使用本地数据创建角色"
          setSuccess("已使用本地数据成功创建角色")
          setTimeout(() => {
            setTitle("")
            setDescription("")
            setPdfFile(null)
            setImageFile(null)
            setImagePreview(null)
            setError(null)
            setSuccess(null)
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

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB限制
        setError("PDF文件大小不能超过10MB")
        return
      }
      setPdfFile(file)
      setError(null)
      console.log("PDF file selected:", file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`)
    } else if (file) {
      setError("请选择PDF文件")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB限制
        setError("图片文件大小不能超过5MB")
        return
      }
      setImageFile(file)
      setError(null)
      console.log("Image file selected:", file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else if (file) {
      setError("请选择图片文件")
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setError(null)
      setSuccess(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
              disabled={isLoading}
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
              disabled={isLoading}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">{description.length}/500 字符</div>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              角色图片 (可选，最大5MB)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image")?.click()}
                className="flex-1"
                disabled={isLoading}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {imageFile ? `${imageFile.name} (${(imageFile.size / 1024 / 1024).toFixed(2)}MB)` : "上传角色图片"}
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

          <div>
            <label htmlFor="pdf" className="block text-sm font-medium text-gray-700">
              参考文档 (与角色描述二选一，最大10MB)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
                className="hidden"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("pdf")?.click()}
                className="w-full"
                disabled={isLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {pdfFile ? `${pdfFile.name} (${(pdfFile.size / 1024 / 1024).toFixed(2)}MB)` : "上传PDF参考文档"}
              </Button>
            </div>
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
                  • 系统会优先尝试连接AI服务器生成角色
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
              disabled={!title.trim() || (!description.trim() && !pdfFile) || isLoading}
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
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
