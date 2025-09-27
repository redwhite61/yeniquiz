import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function toPercentage(value: number) {
  return Math.round(value * 10) / 10
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        quizAttempts: {
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
            completedAt: 'asc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const attempts = user.quizAttempts || []

    const categoryMap = new Map<string, { name: string; totalPercentage: number; count: number }>()
    const quizMap = new Map<
      string,
      { title: string; totalCorrect: number; totalQuestions: number; attemptCount: number }
    >()
    const questionMap = new Map<
      string,
      {
        content: string
        incorrect: number
        total: number
        totalTime: number
        lastAnsweredAt?: Date
        lastResult?: boolean
      }
    >()

    const learningCurve = attempts.map((attempt) => ({
      completedAt: attempt.completedAt?.toISOString() ?? new Date().toISOString(),
      percentage: toPercentage(attempt.percentage ?? 0)
    }))

    for (const attempt of attempts) {
      const percentage = attempt.percentage ?? 0
      const quiz = attempt.quiz
      const category = quiz.category
      const answers = attempt.answers || []
      const perQuestionTime = answers.length > 0 ? attempt.timeSpent / answers.length : 0

      if (category) {
        const existing = categoryMap.get(category.id) || {
          name: category.name,
          totalPercentage: 0,
          count: 0
        }
        existing.totalPercentage += percentage
        existing.count += 1
        categoryMap.set(category.id, existing)
      }

      const quizAggregate = quizMap.get(quiz.id) || {
        title: quiz.title,
        totalCorrect: 0,
        totalQuestions: 0,
        attemptCount: 0
      }
      quizAggregate.totalCorrect += answers.filter((answer) => answer.isCorrect).length
      quizAggregate.totalQuestions += answers.length
      quizAggregate.attemptCount += 1
      quizMap.set(quiz.id, quizAggregate)

      for (const answer of answers) {
        const question = answer.question
        if (!question) continue

        const existingQuestion = questionMap.get(question.id) || {
          content: question.content,
          incorrect: 0,
          total: 0,
          totalTime: 0,
          lastAnsweredAt: undefined as Date | undefined,
          lastResult: undefined as boolean | undefined
        }

        if (!answer.isCorrect) {
          existingQuestion.incorrect += 1
        }
        existingQuestion.total += 1
        existingQuestion.totalTime += perQuestionTime
        existingQuestion.lastAnsweredAt = answer.createdAt
        existingQuestion.lastResult = answer.isCorrect
        questionMap.set(question.id, existingQuestion)
      }
    }

    const categoryPerformance = Array.from(categoryMap.values()).map((item) => ({
      category: item.name,
      successRate: item.count > 0 ? toPercentage(item.totalPercentage / item.count) : 0,
      attempts: item.count
    }))

    const quizPerformance = Array.from(quizMap.values()).map((item) => ({
      quiz: item.title,
      correct: item.totalCorrect,
      total: item.totalQuestions,
      successRate: item.totalQuestions > 0 ? toPercentage((item.totalCorrect / item.totalQuestions) * 100) : 0,
      attempts: item.attemptCount
    }))

    const questionInsights = Array.from(questionMap.values()).map((item) => {
      const incorrectRate = item.total > 0 ? item.incorrect / item.total : 0
      const averageTime = item.total > 0 ? item.totalTime / item.total : 0
      const accuracy = 1 - incorrectRate

      return {
        content: item.content,
        attempts: item.total,
        incorrectRate: toPercentage(incorrectRate * 100),
        averageTime: Math.round(averageTime),
        lastAnsweredAt: item.lastAnsweredAt?.toISOString() ?? null,
        lastResult: item.lastResult ?? null,
        flag:
          accuracy >= 0.8 && averageTime <= 5
            ? 'Hızlı doğru cevap — tahmin olabilir'
            : accuracy <= 0.5
            ? 'Zorlanıyor'
            : null
      }
    })

    questionInsights.sort((a, b) => b.incorrectRate - a.incorrectRate)

    const summary = {
      totalAttempts: attempts.length,
      averagePercentage:
        attempts.length > 0
          ? toPercentage(
              attempts.reduce((sum, attempt) => sum + (attempt.percentage ?? 0), 0) / attempts.length
            )
          : 0,
      improvement:
        attempts.length >= 2
          ? toPercentage(
              (attempts[attempts.length - 1].percentage ?? 0) - (attempts[0].percentage ?? 0)
            )
          : 0
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      summary,
      learningCurve,
      categoryPerformance,
      quizPerformance,
      questionInsights: questionInsights.slice(0, 10)
    })
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return NextResponse.json({ error: 'Kullanıcı analizi yüklenemedi' }, { status: 500 })
  }
}
