import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get total users count
    const totalUsers = await db.user.count()

    // Get total categories count
    const totalCategories = await db.category.count()

    // Get total questions count
    const totalQuestions = await db.question.count()

    // Get total quizzes count
    const totalQuizzes = await db.quiz.count({
      where: { isActive: true }
    })

    // Get total quiz attempts
    const totalAttempts = await db.quizAttempt.count()

    // Get active users (users who have attempted at least one quiz)
    const activeUsers = await db.user.count({
      where: {
        quizAttempts: {
          some: {}
        }
      }
    })

    return NextResponse.json({
      totalUsers,
      totalCategories,
      totalQuestions,
      totalQuizzes,
      totalAttempts,
      activeUsers
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'İstatistikler yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}