import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type CategoryAccumulator = {
  name: string
  totalPercentage: number
  count: number
}

type QuizAccumulator = {
  title: string
  totalPercentage: number
  count: number
}

type QuestionAccumulator = {
  content: string
  incorrect: number
  total: number
  totalTime: number
}

type UserCategoryAccumulator = {
  name: string
  totalPercentage: number
  count: number
}

type UserCategorySummary = {
  userId: string
  name: string
  email: string
  categoryId: string
  categoryName: string
  successRate: number
  attemptCount: number
}

function toPercentage(value: number) {
  return Math.round(value * 10) / 10
}

export async function GET() {
  try {
    const [
      totalUsers,
      totalCategories,
      totalQuestions,
      totalQuizzes,
      totalAttempts,
      activeUsers,
      attempts
    ] = await Promise.all([
      db.user.count(),
      db.category.count(),
      db.question.count(),
      db.quiz.count({ where: { isActive: true } }),
      db.quizAttempt.count(),
      db.user.count({
        where: {
          quizAttempts: {
            some: {}
          }
        }
      }),
      db.quizAttempt.findMany({
        include: {
          quiz: {
            include: {
              category: true
            }
          },
          user: true,
          answers: {
            include: {
              question: true
            }
          }
        }
      })
    ])

    const categoryMap = new Map<string, CategoryAccumulator>()
    const quizMap = new Map<string, QuizAccumulator>()
    const questionMap = new Map<string, QuestionAccumulator>()
    const userCategoryMap = new Map<string, Map<string, UserCategoryAccumulator>>()
    const performanceTimeline: {
      completedAt: string
      percentage: number
      quizTitle: string
    }[] = []

    for (const attempt of attempts) {
      const percentage = attempt.percentage ?? 0
      const quiz = attempt.quiz
      const category = quiz.category

      if (category) {
        const existingCategory = categoryMap.get(category.id) || {
          name: category.name,
          totalPercentage: 0,
          count: 0
        }
        existingCategory.totalPercentage += percentage
        existingCategory.count += 1
        categoryMap.set(category.id, existingCategory)

        const userCategories = userCategoryMap.get(attempt.userId) || new Map<string, UserCategoryAccumulator>()
        const categoryAggregate = userCategories.get(category.id) || {
          name: category.name,
          totalPercentage: 0,
          count: 0
        }
        categoryAggregate.totalPercentage += percentage
        categoryAggregate.count += 1
        userCategories.set(category.id, categoryAggregate)
        userCategoryMap.set(attempt.userId, userCategories)
      }

      const existingQuiz = quizMap.get(quiz.id) || {
        title: quiz.title,
        totalPercentage: 0,
        count: 0
      }
      existingQuiz.totalPercentage += percentage
      existingQuiz.count += 1
      quizMap.set(quiz.id, existingQuiz)

      if (attempt.completedAt) {
        performanceTimeline.push({
          completedAt: attempt.completedAt.toISOString(),
          percentage: toPercentage(percentage),
          quizTitle: quiz.title
        })
      }

      const answers = attempt.answers || []
      const perQuestionTime = answers.length > 0 ? attempt.timeSpent / answers.length : 0

      for (const answer of answers) {
        const question = answer.question
        if (!question) continue

        const existingQuestion = questionMap.get(question.id) || {
          content: question.content,
          incorrect: 0,
          total: 0,
          totalTime: 0
        }

        if (!answer.isCorrect) {
          existingQuestion.incorrect += 1
        }
        existingQuestion.total += 1
        existingQuestion.totalTime += perQuestionTime
        questionMap.set(question.id, existingQuestion)
      }
    }

    const categorySuccess = Array.from(categoryMap.values()).map((item) => ({
      category: item.name,
      successRate: item.count > 0 ? toPercentage(item.totalPercentage / item.count) : 0
    }))

    const mostChallengingCategory = categorySuccess
      .filter((item) => item.successRate > 0)
      .sort((a, b) => a.successRate - b.successRate)[0] || null

    const quizSuccess = Array.from(quizMap.values()).map((item) => ({
      quiz: item.title,
      successRate: item.count > 0 ? toPercentage(item.totalPercentage / item.count) : 0,
      attemptCount: item.count
    }))

    const mostChallengingQuiz = quizSuccess
      .filter((item) => item.attemptCount > 0)
      .sort((a, b) => a.successRate - b.successRate)[0] || null

    const hardestQuestions = Array.from(questionMap.entries()).map(([questionId, item]) => {
      const incorrectRate = item.total > 0 ? item.incorrect / item.total : 0
      const averageTime = item.total > 0 ? item.totalTime / item.total : 0

      return {
        questionId,
        content: item.content,
        incorrectRate: toPercentage(incorrectRate * 100),
        averageTime: Math.round(averageTime),
        attempts: item.total
      }
    })

    const mostMissedQuestions = [...hardestQuestions]
      .filter((item) => item.attempts > 0)
      .sort((a, b) => b.incorrectRate - a.incorrectRate)
      .slice(0, 5)

    const qualityAlerts = hardestQuestions
      .filter((item) => item.attempts >= 5 && item.incorrectRate >= 60)
      .sort((a, b) => b.incorrectRate - a.incorrectRate)
      .slice(0, 6)

    const strugglingAssignments: UserCategorySummary[] = []
    for (const [userId, categories] of userCategoryMap.entries()) {
      const userCategories = Array.from(categories.entries()).map(([categoryId, item]) => ({
        categoryId,
        name: item.name,
        successRate: item.count > 0 ? toPercentage(item.totalPercentage / item.count) : 0,
        attempts: item.count
      }))

      const weakestCategory = userCategories
        .filter((item) => item.attempts >= 1)
        .sort((a, b) => a.successRate - b.successRate)[0]

      if (weakestCategory) {
        const user = attempts.find((attempt) => attempt.userId === userId)?.user
        if (user) {
          strugglingAssignments.push({
            userId,
            name: user.name || user.email,
            email: user.email,
            categoryId: weakestCategory.categoryId,
            categoryName: weakestCategory.name,
            successRate: weakestCategory.successRate,
            attemptCount: weakestCategory.attempts
          })
        }
      }
    }

    strugglingAssignments.sort((a, b) => a.successRate - b.successRate)

    const timeline = performanceTimeline
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .map((item) => ({
        completedAt: item.completedAt,
        label: new Date(item.completedAt).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'short'
        }),
        percentage: item.percentage,
        quizTitle: item.quizTitle
      }))

    return NextResponse.json({
      totals: {
        totalUsers,
        totalCategories,
        totalQuestions,
        totalQuizzes,
        totalAttempts,
        activeUsers
      },
      highlights: {
        mostChallengingCategory,
        mostChallengingQuiz,
        mostMissedQuestions
      },
      charts: {
        categorySuccess,
        quizSuccess,
        performanceTimeline: timeline,
        hardestQuestions
      },
      smartInsights: {
        strugglingAssignments: strugglingAssignments.slice(0, 8),
        qualityAlerts
      }
    })
  } catch (error) {
    console.error('Error building admin analytics overview:', error)
    return NextResponse.json(
      { error: 'Analitik veriler yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
