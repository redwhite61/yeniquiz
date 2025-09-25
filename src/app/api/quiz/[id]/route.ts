import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const quiz = await db.quiz.findUnique({
      where: { id },
      include: {
        category: true,
        questions: {
          include: {
            question: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Test bulunamadı' },
        { status: 404 }
      )
    }

    // Parse options for each question and convert to new format
    const quizWithParsedOptions = {
      ...quiz,
      questions: quiz.questions.map(qq => ({
        ...qq,
        question: {
          ...qq.question,
          options: qq.question.options ? 
            (() => {
              // If it's already an array, use it directly
              if (Array.isArray(qq.question.options)) {
                return qq.question.options.map((opt: any) => 
                  typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
                )
              }
              
              // If it's a string, try to parse it as JSON
              if (typeof qq.question.options === 'string') {
                try {
                  const parsed = JSON.parse(qq.question.options)
                  return Array.isArray(parsed) ? parsed.map((opt: any) => 
                    typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
                  ) : []
                } catch (error) {
                  // Fallback: if it's not valid JSON, treat it as a comma-separated string
                  console.warn('Invalid options JSON, falling back to comma-separated format:', qq.question.options)
                  return qq.question.options.split(',').map((text: string) => ({
                    text: text.trim(),
                    imageUrl: ''
                  }))
                }
              }
              
              // Fallback for any other type
              console.warn('Unexpected options type:', typeof qq.question.options, qq.question.options)
              return []
            })()
            : []
        }
      }))
    }

    return NextResponse.json(quizWithParsedOptions)
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json(
      { error: 'Test yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}