import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const where = categoryId ? { categoryId } : {}

    const quizzes = await db.quiz.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { error: 'Testler yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, categoryId, timeLimit, questionIds } = await request.json()

    if (!title || !categoryId) {
      return NextResponse.json(
        { error: 'Başlık ve kategori gereklidir' },
        { status: 400 }
      )
    }

    // Create quiz
    const quiz = await db.quiz.create({
      data: {
        title,
        description,
        categoryId,
        timeLimit
      }
    })

    // Add questions to quiz if provided
    if (questionIds && questionIds.length > 0) {
      await db.quizQuestion.createMany({
        data: questionIds.map((questionId: string, index: number) => ({
          quizId: quiz.id,
          questionId,
          order: index
        }))
      })
    }

    const quizWithQuestions = await db.quiz.findUnique({
      where: { id: quiz.id },
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

    return NextResponse.json({
      message: 'Test başarıyla oluşturuldu',
      quiz: quizWithQuestions
    })
  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json(
      { error: 'Test oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}