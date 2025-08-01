import type { Metadata } from "next"
import PokemonGame from "@/components/pokemon-game"

export const metadata: Metadata = {
  title: "神奇宝贝对战游戏",
  description: "经典的神奇宝贝回合制对战游戏",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "神奇宝贝对战",
  },
  manifest: "/manifest.json",
}

export default function HomePage() {
  return <PokemonGame />
}
