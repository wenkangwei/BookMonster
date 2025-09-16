"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Pokemon } from "@/types/game"

interface PokemonSidebarProps {
  pokemons: Pokemon[]
  selectedPokemon: Pokemon | null
  onCreateClick: () => void
  onSelectPokemon: (pokemon: Pokemon) => void
}

export function PokemonSidebar({ pokemons, selectedPokemon, onCreateClick, onSelectPokemon }: PokemonSidebarProps) {
  return (
    <div className="w-64 bg-amber-100 border-r-4 border-amber-800 p-4 h-full overflow-y-auto">
      <div className="space-y-4">
        <Button onClick={onCreateClick} className="w-full bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          创建神奇宝贝
        </Button>

        <div className="space-y-2">
          {pokemons.map((pokemon) => (
            <Card
              key={pokemon.id}
              className={`cursor-pointer transition-all ${
                selectedPokemon?.id === pokemon.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
              }`}
              onClick={() => onSelectPokemon(pokemon)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={pokemon.image || "/placeholder.svg"}
                    alt={pokemon.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{pokemon.name}</p>
                    <p className="text-xs text-gray-600">Lv.{pokemon.level}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(pokemon.hp / pokemon.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
