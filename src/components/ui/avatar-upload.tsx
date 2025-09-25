'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, X, Upload } from 'lucide-react'

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (url: string) => void
  onFileChange?: (file: File) => void
  size?: number
  className?: string
}

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  onFileChange,
  size = 120,
  className = ""
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir resim dosyası seçin')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'dan küçük olmalı')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file to server
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Resim yüklenirken bir hata oluştu')
      }
      
      const data = await response.json()
      
      // Use the server URL
      onAvatarChange(data.url)
      onFileChange?.(file)
      
    } catch (err) {
      setError('Resim yüklenirken bir hata oluştu')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const removeAvatar = () => {
    setPreviewUrl(null)
    onAvatarChange('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div
        className="relative group cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className="rounded-full overflow-hidden border-4 border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:border-white/40 group-hover:scale-105"
          style={{
            width: size,
            height: size,
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profil resmi"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = ''
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <div className="text-center">
                <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <span className="text-xs text-purple-400">Resim Yükle</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Loading Spinner */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Remove Button */}
        {previewUrl && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeAvatar()
            }}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200 shadow-lg"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="text-center space-y-2">
        <p className="text-sm text-purple-300">
          {isUploading ? 'Yükleniyor...' : 'Tıklayın veya sürükleyip bırakın'}
        </p>
        <p className="text-xs text-purple-400">
          Maksimum 5MB • JPG, PNG, GIF
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}