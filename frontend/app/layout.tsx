import './globals.css'
import type { Metadata } from 'next'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: 'AdGen.ai',
  description: 'AI 기반 광고 이미지 생성 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jua&family=Nanum+Myeongjo:wght@400;700;800&family=Black+Han+Sans&family=Do+Hyeon&family=Dongle&family=Hahmlet:wght@400;700&family=Gamja+Flower&family=Single+Day&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface overflow-hidden">
        <LayoutWrapper>{children}</LayoutWrapper>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
