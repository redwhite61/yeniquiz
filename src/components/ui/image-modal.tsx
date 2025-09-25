'use client'

import { useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  alt?: string
}

export function ImageModal({ isOpen, onClose, imageUrl, alt = "Resim" }: ImageModalProps) {
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-7xl max-h-[90vh] m-4">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-4 -right-4 z-10 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Image Container */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Image Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="text-white text-xs opacity-75 text-center">
              {alt}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}