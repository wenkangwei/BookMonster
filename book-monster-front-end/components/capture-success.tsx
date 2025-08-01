"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Pokemon } from "@/types/game"

interface CaptureSuccessProps {
  pokemon: Pokemon
  onConfirm: () => void
}

export function CaptureSuccess({ pokemon, onConfirm }: CaptureSuccessProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-purple-400 to-pink-400">
      <Card className="w-96 text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-green-600">捕获成功！</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <img
            src={pokemon.image || "/placeholder.svg"}
            alt={pokemon.name}
            className="w-32 h-32 mx-auto object-contain"
          />
          <div>
            <h3 className="text-xl font-bold">{pokemon.name}</h3>
            <p className="text-gray-600">等级 {pokemon.level}</p>
          </div>
          {pokemon.description && (
            <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded">{pokemon.description}</p>
          )}
          <div className="space-y-2">
            <h4 className="font-semibold">技能：</h4>
            <div className="grid grid-cols-2 gap-2">
              {pokemon.skills.map((skill) => (
                <div key={skill.id} className="bg-blue-100 p-2 rounded text-sm">
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
          <Button onClick={onConfirm} className="w-full">
            确认
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
