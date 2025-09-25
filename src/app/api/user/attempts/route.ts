import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID gereklidir' },
        { status: 400 }
      )
    }

    const attempts = await db.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            category: true
          }
        },
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Parse options for questions
    const attemptsWithParsedOptions = attempts.map(attempt => ({
      ...attempt,
      quiz: {
        ...attempt.quiz,
        category: {
          ...attempt.quiz.category
        }
      },
      answers: attempt.answers.map(answer => ({
        ...answer,
        question: {
          ...answer.question,
          options: answer.question.options ? JSON.parse(answer.question.options) : []
        }
      }))
    }))

    return NextResponse.json(attemptsWithParsedOptions)
  } catch (error) {
    console.error('Get user attempts error:', error)
    return NextResponse.json(
      { error: 'Kullanıcı denemeleri yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}