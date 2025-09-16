import type { Metadata } from "next"
import BookMonsterGame from "@/components/bookmonster-game"

export const metadata: Metadata = {
  title: "书籍怪兽对战游戏",
  description: "经典的书籍怪兽回合制对战游戏",
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
    title: "书籍怪兽对战",
  },
  manifest: "/manifest.json",
}

export default function HomePage() {
  return <BookMonsterGame />
}
