"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, FileText, AlertCircle, BookOpen } from "lucide-react"
import type { CreatePokemonData } from "@/types/game"

interface CreatePokemonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreatePokemon: (data: CreatePokemonData) => Promise<void>
}

export function CreatePokemonDialog({ open, onOpenChange, onCreatePokemon }: CreatePokemonDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    try {
      console.log("Creating pokemon with new API:", { title, description, hasPdf: !!pdfFile, hasImage: !!imageFile })

      await onCreatePokemon({
        title: title.trim(),
        description: description.trim() || "基于PDF文档生成的角色",
        pdfFile: pdfFile || undefined,
        imageFile: imageFile || undefined,
      })

      // 重置表单
      setTitle("")
      setDescription("")
      setPdfFile(null)
      setImageFile(null)
      setImagePreview(null)
      setError(null)
      onOpenChange(false)
    } catch (error) {
      console.error("创建神奇宝贝失败:", error)

      let errorMessage = "创建失败，请重试"

      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "请求超时，但已使用本地数据创建角色"
          setTimeout(() => {
            setTitle("")
            setDescription("")
            setPdfFile(null)
            setImageFile(null)
            setImagePreview(null)
            setError(null)
            onOpenChange(false)
          }, 2000)
        } else if (error.message.includes("Network error")) {
          errorMessage = "网络连接失败，但已使用本地数据创建角色"
          setTimeout(() => {
            setTitle("")
            setDescription("")
            setPdfFile(null)
            setImageFile(null)
            setImagePreview(null)
            setError(null)
            onOpenChange(false)
          }, 2000)
        } else {
          errorMessage = `创建失败: ${error.message}`
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setPdfFile(file)
      setError(null)
    } else if (file) {
      setError("请选择PDF文件")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setImageFile(file)
      setError(null)
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
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            创建敌方神奇宝贝
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
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
              placeholder="输入神奇宝贝名称"
              disabled={isLoading}
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
              placeholder="描述神奇宝贝的特征、能力和背景故事"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              角色图片 (可选)
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
                {imageFile ? imageFile.name : "上传角色图片"}
              </Button>
            </div>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="pdf" className="block text-sm font-medium text-gray-700">
              参考文档 (与角色描述二选一)
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
                {pdfFile ? pdfFile.name : "上传PDF参考文档"}
              </Button>
            </div>
            {pdfFile && (
              <p className="text-xs text-gray-500 mt-1">
                已选择: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 提示：上传的PDF文档和图片将用于生成独特的神奇宝贝角色。系统会根据内容自动生成属性、技能和外观。
            </p>
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
                "创建敌方神奇宝贝"
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
