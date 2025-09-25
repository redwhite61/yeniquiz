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
        },
        _count: {
          select: {
            questions: true,
            attempts: true
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

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json(
      { error: 'Test yüklenirken bir hata oluştu' },
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
    const { title, description, categoryId, timeLimit, questionIds } = await request.json()

    if (!title || !categoryId) {
      return NextResponse.json(
        { error: 'Başlık ve kategori gereklidir' },
        { status: 400 }
      )
    }

    // Check if quiz exists
    const existingQuiz = await db.quiz.findUnique({
      where: { id }
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Test bulunamadı' },
        { status: 404 }
      )
    }

    // Update quiz
    const updatedQuiz = await db.quiz.update({
      where: { id },
      data: {
        title,
        description,
        categoryId,
        timeLimit
      }
    })

    // Update quiz questions
    if (questionIds) {
      // Remove existing questions
      await db.quizQuestion.deleteMany({
        where: { quizId: id }
      })

      // Add new questions
      if (questionIds.length > 0) {
        await db.quizQuestion.createMany({
          data: questionIds.map((questionId: string, index: number) => ({
            quizId: id,
            questionId,
            order: index
          }))
        })
      }
    }

    const quizWithQuestions = await db.quiz.findUnique({
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
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Test başarıyla güncellendi',
      quiz: quizWithQuestions
    })
  } catch (error) {
    console.error('Update quiz error:', error)
    return NextResponse.json(
      { error: 'Test güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if quiz exists
    const existingQuiz = await db.quiz.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      }
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Test bulunamadı' },
        { status: 404 }
      )
    }

    // Check if quiz has attempts
    if (existingQuiz._count.attempts > 0) {
      return NextResponse.json(
        { error: 'Bu testi silmek için önce tüm çözümlerin silinmesi gerekir' },
        { status: 400 }
      )
    }

    // Delete quiz questions first
    await db.quizQuestion.deleteMany({
      where: { quizId: id }
    })

    // Delete quiz
    await db.quiz.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Test başarıyla silindi'
    })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Test silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}