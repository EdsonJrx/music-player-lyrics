import Footer from '@renderer/components/Footer'
import Header from '@renderer/components/Header'
import Lyrics from '@renderer/components/Lyrics'
import { enableDrag } from '@shared/drag'
import { useEffect, useRef } from 'react'

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      enableDrag(containerRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full group bg-transparent relative overflow-hidden  hover:bg-[#1c1c1c] hover:border rounded-xl border-[#1c1c1c] "
    >
      {/* Agora tudo dentro da área arrastável */}
      <Header />
      <Lyrics />
      <Footer />
    </div>
  )
}
