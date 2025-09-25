import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const question = await db.question.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Soru bulunamadı' },
        { status: 404 }
      )
    }

    // Parse options if they exist and convert to new format
    const questionWithParsedOptions = {
      ...question,
      options: question.options ? 
        (() => {
          // If it's already an array, use it directly
          if (Array.isArray(question.options)) {
            return question.options.map(opt => 
              typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
            )
          }
          
          // If it's a string, try to parse it as JSON
          if (typeof question.options === 'string') {
            try {
              const parsed = JSON.parse(question.options)
              return Array.isArray(parsed) ? parsed.map(opt => 
                typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
              ) : []
            } catch (error) {
              // Fallback: if it's not valid JSON, treat it as a comma-separated string
              console.warn('Invalid options JSON, falling back to comma-separated format:', question.options)
              return question.options.split(',').map(text => ({
                text: text.trim(),
                imageUrl: ''
              }))
            }
          }
          
          // Fallback for any other type
          console.warn('Unexpected options type:', typeof question.options, question.options)
          return []
        })()
        : []
    }

    return NextResponse.json(questionWithParsedOptions)
  } catch (error) {
    console.error('Get question error:', error)
    return NextResponse.json(
      { error: 'Soru yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { content, type, options, correctAnswer, imageUrl, points, difficulty, categoryId } = await request.json()

    if (!content || !categoryId) {
      return NextResponse.json(
        { error: 'Soru içeriği ve kategori gereklidir' },
        { status: 400 }
      )
    }

    // Validate image URL for IMAGE type questions
    if (type === 'IMAGE' && !imageUrl) {
      return NextResponse.json(
        { error: 'Resimli sorular için resim URL gereklidir' },
        { status: 400 }
      )
    }

    // Convert options to the new format if needed
    const formattedOptions = options ? options.map(opt => 
      typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
    ) : []

    const question = await db.question.update({
      where: { id },
      data: {
        content,
        type,
        options: formattedOptions.length > 0 ? JSON.stringify(formattedOptions) : null,
        correctAnswer,
        imageUrl: imageUrl || null,
        points: points || 1,
        difficulty,
        categoryId
      }
    })

    // Parse options for response
    const questionWithParsedOptions = {
      ...question,
      options: question.options ? 
        (() => {
          // If it's already an array, use it directly
          if (Array.isArray(question.options)) {
            return question.options.map(opt => 
              typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
            )
          }
          
          // If it's a string, try to parse it as JSON
          if (typeof question.options === 'string') {
            try {
              const parsed = JSON.parse(question.options)
              return Array.isArray(parsed) ? parsed.map(opt => 
                typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
              ) : []
            } catch (error) {
              // Fallback: if it's not valid JSON, treat it as a comma-separated string
              console.warn('Invalid options JSON, falling back to comma-separated format:', question.options)
              return question.options.split(',').map(text => ({
                text: text.trim(),
                imageUrl: ''
              }))
            }
          }
          
          // Fallback for any other type
          console.warn('Unexpected options type:', typeof question.options, question.options)
          return []
        })()
        : []
    }

    return NextResponse.json({
      message: 'Soru başarıyla güncellendi',
      question: questionWithParsedOptions
    })
  } catch (error) {
    console.error('Update question error:', error)
    return NextResponse.json(
      { error: 'Soru güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if question is used in any quizzes
    const quizQuestions = await db.quizQuestion.findMany({
      where: { questionId: id }
    })

    if (quizQuestions.length > 0) {
      return NextResponse.json(
        { error: 'Bu soruyu silemezsiniz. Bir veya daha fazla testte kullanılıyor.' },
        { status: 400 }
      )
    }

    await db.question.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Soru başarıyla silindi'
    })
  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json(
      { error: 'Soru silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}