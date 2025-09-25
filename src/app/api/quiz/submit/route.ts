import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to calculate user rank
async function calculateUserRank(userId: string) {
  // Get all users with their total scores
  const userStats = await db.quizAttempt.groupBy({
    by: ['userId'],
    _sum: {
      score: true
    },
    _count: {
      _all: true
    },
    orderBy: {
      _sum: {
        score: 'desc'
      }
    }
  })

  // Find the current user's rank
  const userRank = userStats.findIndex(stat => stat.userId === userId) + 1
  
  return userRank
}

// Helper function to get users around a specific rank
async function getUsersAroundRank(targetRank: number, limit: number = 5) {
  const userStats = await db.quizAttempt.groupBy({
    by: ['userId'],
    _sum: {
      score: true
    },
    _count: {
      _all: true
    },
    orderBy: {
      _sum: {
        score: 'desc'
      }
    }
  })

  const startIndex = Math.max(0, targetRank - limit - 1)
  const endIndex = Math.min(userStats.length, targetRank + limit)
  
  return userStats.slice(startIndex, endIndex)
}

export async function POST(request: NextRequest) {
  try {
    const { userId, quizId, answers, timeSpent, startedAt } = await request.json()

    if (!userId || !quizId || !answers) {
      return NextResponse.json(
        { error: 'Kullanıcı ID, test ID ve cevaplar gereklidir' },
        { status: 400 }
      )
    }

    // Get user's current rank before this quiz
    const oldRank = await calculateUserRank(userId)

    // Get quiz with questions
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
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

    // Calculate score
    let totalScore = 0
    let maxScore = 0
    const processedAnswers = []

    for (const quizQuestion of quiz.questions) {
      const question = quizQuestion.question
      const userAnswer = answers[question.id]
      maxScore += question.points

      let isCorrect = false
      let points = 0

      if (userAnswer !== undefined) {
        if (question.type === 'TEXT') {
          isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
        } else {
          isCorrect = userAnswer === question.correctAnswer
        }
        
        if (isCorrect) {
          points = question.points
          totalScore += points
        }
      }

      processedAnswers.push({
        userId,
        questionId: question.id,
        answer: userAnswer || '',
        isCorrect,
        points
      })
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

    // Create quiz attempt
    const quizAttempt = await db.quizAttempt.create({
      data: {
        userId,
        quizId,
        score: totalScore,
        maxScore,
        percentage,
        timeSpent,
        startedAt: new Date(startedAt || Date.now() - timeSpent * 1000)
      }
    })

    // Create answers
    for (const answerData of processedAnswers) {
      await db.answer.create({
        data: {
          ...answerData,
          quizAttemptId: quizAttempt.id
        }
      })
    }

    // Get user's new rank after this quiz
    const newRank = await calculateUserRank(userId)

    // Get user info
    const userInfo = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    // Check if user passed anyone (find who was at the new rank before)
    let passedUserInfo = null
    if (newRank < oldRank) {
      // User improved their rank, find who they might have passed
      const usersAroundNewRank = await getUsersAroundRank(newRank)
      const passedUser = usersAroundNewRank.find(stat => {
        const statRank = usersAroundNewRank.findIndex(s => s.userId === stat.userId) + 1
        return statRank === newRank + 1 && stat.userId !== userId
      })
      
      if (passedUser) {
        passedUserInfo = await db.user.findUnique({
          where: { id: passedUser.userId },
          select: {
            id: true,
            name: true,
            email: true
          }
        })
      }
    }

    // Fetch the complete quiz attempt with answers and questions
    const completeQuizAttempt = await db.quizAttempt.findUnique({
      where: { id: quizAttempt.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    })

    // Parse options for each question in the answers and convert to new format
    const processedQuizAttempt = {
      ...completeQuizAttempt,
      answers: completeQuizAttempt.answers.map(answer => ({
        ...answer,
        question: {
          ...answer.question,
          options: answer.question.options ? 
            (() => {
              // If it's already an array, use it directly
              if (Array.isArray(answer.question.options)) {
                return answer.question.options.map((opt: any) => 
                  typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
                )
              }
              
              // If it's a string, try to parse it as JSON
              if (typeof answer.question.options === 'string') {
                try {
                  const parsed = JSON.parse(answer.question.options)
                  return Array.isArray(parsed) ? parsed.map((opt: any) => 
                    typeof opt === 'string' ? { text: opt, imageUrl: '' } : opt
                  ) : []
                } catch (error) {
                  // Fallback: if it's not valid JSON, treat it as a comma-separated string
                  console.warn('Invalid options JSON, falling back to comma-separated format:', answer.question.options)
                  return answer.question.options.split(',').map((text: string) => ({
                    text: text.trim(),
                    imageUrl: ''
                  }))
                }
              }
              
              // Fallback for any other type
              console.warn('Unexpected options type:', typeof answer.question.options, answer.question.options)
              return []
            })()
            : []
        }
      }))
    }

    return NextResponse.json({
      message: 'Test başarıyla tamamlandı',
      quizAttempt: processedQuizAttempt,
      rankData: {
        oldRank,
        newRank,
        improved: newRank < oldRank,
        passedUser: passedUserInfo ? {
          id: passedUserInfo.id,
          name: passedUserInfo.name || passedUserInfo.email
        } : null
      }
    })
  } catch (error) {
    console.error('Submit quiz error:', error)
    return NextResponse.json(
      { error: 'Test gönderilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}