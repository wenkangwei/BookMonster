"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Camera, Award, Star, Plus, X } from "lucide-react"
import type { Player } from "@/types/game"

interface TrainerProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: Player
  onSave: (player: Player) => void
}

const BOOKMONSTER_TYPES = [
  "火",
  "水",
  "草",
  "电",
  "地面",
  "飞行",
  "钢",
  "超能力",
  "岩石",
  "冰",
  "龙",
  "恶",
  "妖精",
  "虫",
  "毒",
  "格斗",
  "幽灵",
  "普通",
]

const HOMETOWNS = [
  "真新镇",
  "常磐市",
  "尼比市",
  "华蓝市",
  "枯叶市",
  "彩虹市",
  "浅红市",
  "金黄市",
  "红莲岛",
  "常青市",
  "桔梗市",
  "桧皮镇",
]

const AVAILABLE_BADGES = [
  "岩石徽章",
  "蓝色徽章",
  "橙色徽章",
  "彩虹徽章",
  "粉红徽章",
  "金色徽章",
  "深红徽章",
  "绿色徽章",
]

const AVAILABLE_ACHIEVEMENTS = [
  "新手训练师",
  "书籍怪兽收集家",
  "对战专家",
  "探险家",
  "研究员",
  "繁殖专家",
  "协调训练师",
  "冠军挑战者",
]

export function TrainerProfileDialog({ open, onOpenChange, player, onSave }: TrainerProfileDialogProps) {
  const [formData, setFormData] = useState<Player>(player)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [newBadge, setNewBadge] = useState("")
  const [newAchievement, setNewAchievement] = useState("")

  useEffect(() => {
    setFormData(player)
    setAvatarPreview(null)
  }, [player, open])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAvatarPreview(result)
        setFormData((prev) => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddBadge = () => {
    if (newBadge && !formData.badges?.includes(newBadge)) {
      setFormData((prev) => ({
        ...prev,
        badges: [...(prev.badges || []), newBadge],
      }))
      setNewBadge("")
    }
  }

  const handleRemoveBadge = (badge: string) => {
    setFormData((prev) => ({
      ...prev,
      badges: prev.badges?.filter((b) => b !== badge) || [],
    }))
  }

  const handleAddAchievement = () => {
    if (newAchievement && !formData.achievements?.includes(newAchievement)) {
      setFormData((prev) => ({
        ...prev,
        achievements: [...(prev.achievements || []), newAchievement],
      }))
      setNewAchievement("")
    }
  }

  const handleRemoveAchievement = (achievement: string) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements?.filter((a) => a !== achievement) || [],
    }))
  }

  const handleSave = () => {
    // 保存到localStorage
    localStorage.setItem("trainer_profile", JSON.stringify(formData))
    onSave(formData)
    onOpenChange(false)
  }

  const handleReset = () => {
    setFormData(player)
    setAvatarPreview(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            训练师档案
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 头像和基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 头像上传 */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={avatarPreview || formData.avatar || "/placeholder.svg"}
                    alt="训练师头像"
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-200"
                  />
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label htmlFor="name">训练师姓名</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="输入你的训练师名字"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="age">年龄</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, age: Number(e.target.value) || undefined }))}
                        placeholder="年龄"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">性别</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: "male" | "female") =>
                          setFormData((prev) => ({ ...prev, gender: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">男</SelectItem>
                          <SelectItem value="female">女</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 出身地和喜欢的属性 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hometown">出身地</Label>
                  <Select
                    value={formData.hometown || ""}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, hometown: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择出身地" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOMETOWNS.map((town) => (
                        <SelectItem key={town} value={town}>
                          {town}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="favoriteType">喜欢的属性</Label>
                  <Select
                    value={formData.favoriteType || ""}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, favoriteType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择喜欢的属性" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOKMONSTER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 个人描述 */}
              <div>
                <Label htmlFor="description">个人描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="介绍一下你自己和你的训练师之路..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 徽章收集 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5" />
                徽章收集
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newBadge} onValueChange={setNewBadge}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择徽章" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_BADGES.filter((badge) => !formData.badges?.includes(badge)).map((badge) => (
                      <SelectItem key={badge} value={badge}>
                        {badge}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddBadge} disabled={!newBadge}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary" className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {badge}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-4 h-4 p-0 ml-1"
                      onClick={() => handleRemoveBadge(badge)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 成就系统 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                成就系统
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newAchievement} onValueChange={setNewAchievement}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择成就" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ACHIEVEMENTS.filter((achievement) => !formData.achievements?.includes(achievement)).map(
                      (achievement) => (
                        <SelectItem key={achievement} value={achievement}>
                          {achievement}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddAchievement} disabled={!newAchievement}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.achievements?.map((achievement) => (
                  <Badge key={achievement} variant="outline" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {achievement}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-4 h-4 p-0 ml-1"
                      onClick={() => handleRemoveAchievement(achievement)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              保存档案
            </Button>
            <Button onClick={handleReset} variant="outline">
              重置
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="ghost">
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
