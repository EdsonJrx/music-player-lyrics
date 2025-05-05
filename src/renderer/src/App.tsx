'use client'
import { useEffect, useRef } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Lyrics from '@/components/Lyrics'
import { enableDrag } from '@shared/drag'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      enableDrag(containerRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full group bg-transparent relative overflow-hidden"
    >
      {/* Agora tudo dentro da área arrastável */}
      <Header />
      <Lyrics />
      <Footer />
    </div>
  )
}
