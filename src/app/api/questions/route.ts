import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const where = categoryId ? { categoryId } : {}

    const questions = await db.question.findMany({
      where,
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse options JSON for each question and convert to new format
    const questionsWithParsedOptions = questions.map(question => ({
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
    }))

    return NextResponse.json(questionsWithParsedOptions)
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json(
      { error: 'Sorular yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, type, options, correctAnswer, imageUrl, points, difficulty, categoryId } = await request.json()

    if (!content || !categoryId || !correctAnswer) {
      return NextResponse.json(
        { error: 'İçerik, kategori ve doğru cevap gereklidir' },
        { status: 400 }
      )
    }

    // Validate options for multiple choice and true/false questions
    if ((type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') && (!options || !Array.isArray(options) || options.length === 0)) {
      return NextResponse.json(
        { error: 'Çoktan seçmeli ve doğru/yanlış sorular için seçenekler gereklidir' },
        { status: 400 }
      )
    }

    // Validate image URL for IMAGE type questions
    if (type === 'IMAGE' && !imageUrl) {
      return NextResponse.json(
        { error: 'Resimli sorular için lütfen bir resim yükleyin. Resim yüklemeden soruyu kaydedemezsiniz.' },
        { status: 400 }
      )
    }

    // Convert options to the new format if needed
    const formattedOptions = options ? options.map(opt => 
      typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
    ) : []

    const question = await db.question.create({
      data: {
        content,
        type,
        options: formattedOptions.length > 0 ? JSON.stringify(formattedOptions) : null,
        correctAnswer: correctAnswer.toString(),
        imageUrl: imageUrl || null,
        points: points || 1,
        difficulty: difficulty || 'MEDIUM',
        categoryId
      },
      include: {
        category: true
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
      message: 'Soru başarıyla oluşturuldu',
      question: questionWithParsedOptions
    })
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json(
      { error: 'Soru oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}