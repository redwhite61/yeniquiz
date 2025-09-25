import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID gereklidir' },
        { status: 400 }
      )
    }

    // Get user's completed attempts
    const attempts = await db.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          select: {
            title: true,
            category: {
              select: {
                name: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Calculate statistics
    const completedTests = attempts.length
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0)
    const maxScore = attempts.reduce((sum, attempt) => sum + attempt.maxScore, 0)
    const successRate = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0)

    // Get user's ranking
    const ranking = await db.$queryRaw`
      WITH user_stats AS (
        SELECT 
          u.id,
          SUM(qa.score) as total_score,
          SUM(qa.maxScore) as max_score,
          AVG(qa.percentage) as avg_percentage,
          COUNT(qa.id) as attempt_count
        FROM \`main\`.\`User\` u
        LEFT JOIN \`main\`.\`QuizAttempt\` qa ON u.id = qa.userId
        GROUP BY u.id
      )
      SELECT COUNT(*) + 1 as rank
      FROM user_stats
      WHERE (total_score > (
        SELECT total_score 
        FROM user_stats 
        WHERE id = ${userId}
      ) OR (total_score = (
        SELECT total_score 
        FROM user_stats 
        WHERE id = ${userId}
      ) AND avg_percentage > (
        SELECT avg_percentage 
        FROM user_stats 
        WHERE id = ${userId}
      )))
      AND attempt_count > 0
    ` as Array<{ rank: number }>

    const userRank = ranking.length > 0 ? Number(ranking[0].rank) : '-'

    return NextResponse.json({
      completedTests,
      successRate,
      ranking: userRank,
      totalScore,
      maxScore,
      totalTimeSpent,
      recentAttempts: attempts.slice(0, 5) // Last 5 attempts
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Kullanıcı istatistikleri yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}