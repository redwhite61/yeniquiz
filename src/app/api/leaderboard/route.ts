import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all quiz attempts with user and quiz info
    const attempts = await db.quizAttempt.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        percentage: 'desc'
      }
    })

    // Calculate user statistics
    const userStats = new Map()
    
    for (const attempt of attempts) {
      const userId = attempt.user.id
      const userName = attempt.user.name || attempt.user.email
      
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          id: userId,
          name: userName,
          email: attempt.user.email,
          avatar: attempt.user.avatar,
          totalScore: 0,
          totalQuizzes: 0,
          totalPercentage: 0,
          bestScore: 0,
          attempts: []
        })
      }
      
      const stats = userStats.get(userId)
      stats.totalScore += attempt.score
      stats.totalQuizzes += 1
      stats.totalPercentage += attempt.percentage
      stats.bestScore = Math.max(stats.bestScore, attempt.score)
      stats.attempts.push(attempt)
    }

    // Convert to array and calculate averages
    const topUsers = Array.from(userStats.values())
      .map(stats => ({
        ...stats,
        averagePercentage: stats.totalQuizzes > 0 ? stats.totalPercentage / stats.totalQuizzes : 0
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 50) // Top 50 users

    // Add ranks
    const rankedUsers = topUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }))

    // Find current user (if we had user context, we'd filter here)
    // For now, we'll return all top users and let the frontend handle current user

    return NextResponse.json({
      topUsers: rankedUsers,
      currentUser: null // This would be populated if we had user context
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json(
      { error: 'Liderlik tablosu yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}