import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user's quiz attempts
    const attempts = await db.quizAttempt.findMany({
      where: { userId: id },
      include: {
        quiz: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 10 // Last 10 attempts
    })

    // Calculate statistics
    const totalQuizzes = attempts.length
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0)
    const averagePercentage = totalQuizzes > 0 
      ? attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalQuizzes 
      : 0
    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0)
    const bestScore = totalQuizzes > 0 ? Math.max(...attempts.map(a => a.score)) : 0

    const userStats = {
      totalQuizzes,
      totalScore,
      averagePercentage,
      totalTimeSpent,
      bestScore,
      recentAttempts: attempts
    }

    return NextResponse.json(userStats)
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Profil bilgileri yüklenirken bir hata oluştu' },
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
    const { avatar } = await request.json()

    // Check if user exists first
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 404 }
      )
    }

    // Update user avatar
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        avatar: avatar || null
      }
    })

    return NextResponse.json({
      message: 'Profil başarıyla güncellendi',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    })
  } catch (error: any) {
    console.error('Update user profile error:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Profil güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}