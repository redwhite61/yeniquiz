'use client'

import { useEffect, useState } from 'react'

export default function TestImagesPage() {
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    // Get all uploaded images
    const testImages = [
      '/uploads/1758701411128-tvfesw.png',
      '/uploads/1758701392934-3lrk9h.png',
      '/uploads/1758701149506-xlmo24.png',
      '/uploads/1758699683524-pps5j1.png',
      '/uploads/1758699691215-grzc3p.png',
    ]
    setImages(testImages)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Test Images</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((src, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="text-sm font-mono mb-2">{src}</h3>
            <img 
              src={src} 
              alt={`Test ${index}`}
              className="w-full h-32 object-cover rounded"
              onError={(e) => {
                console.error(`Failed to load ${src}:`, e)
                e.currentTarget.style.border = '2px solid red'
              }}
              onLoad={(e) => {
                console.log(`Successfully loaded ${src}`)
                e.currentTarget.style.border = '2px solid green'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}