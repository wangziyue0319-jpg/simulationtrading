import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-cute",
  display: "swap",
})

export const metadata: Metadata = {
  title: "模拟交易 - 0成本练理财",
  description: "虚拟基金交易模拟器，10万元理财金，免费学习投资理财",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={nunito.variable}>{children}</body>
    </html>
  )
}
