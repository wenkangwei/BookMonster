"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, ImageIcon } from "lucide-react"
import type { CreatePokemonData } from "@/types/game"

interface CreatePokemonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreatePokemon: (data: CreatePokemonData) => void
}

export function CreatePokemonDialog({ open, onOpenChange, onCreatePokemon }: CreatePokemonDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleSubmit = () => {
    if (title && description) {
      onCreatePokemon({
        title,
        description,
        pdfFile: pdfFile || undefined,
        imageFile: imageFile || undefined,
      })
      setTitle("")
      setDescription("")
      setPdfFile(null)
      setImageFile(null)
      setImagePreview(null)
      onOpenChange(false)
    }
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setPdfFile(file)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建敌方神奇宝贝</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              标题
            </label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入神奇宝贝名称" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              描述
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述神奇宝贝的特征和能力"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              神奇宝贝图片 (可选)
            </label>
            <div className="flex items-center gap-2">
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image")?.click()}
                className="flex-1"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {imageFile ? imageFile.name : "上传图片"}
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
              PDF文件 (可选)
            </label>
            <div className="flex items-center gap-2">
              <Input id="pdf" type="file" accept=".pdf" onChange={handlePdfChange} className="hidden" />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("pdf")?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {pdfFile ? pdfFile.name : "上传PDF文件"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              创建敌方神奇宝贝
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
