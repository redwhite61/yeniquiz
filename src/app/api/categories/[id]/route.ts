import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quizzes: true,
            questions: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { error: 'Kategori yüklenirken bir hata oluştu' },
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
    const { name, description, color } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Kategori adı gereklidir' },
        { status: 400 }
      )
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name,
        description,
        color: color || '#3B82F6'
      }
    })

    return NextResponse.json({
      message: 'Kategori başarıyla güncellendi',
      category
    })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'Kategori güncellenirken bir hata oluştu' },
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

    // Check if category has quizzes or questions
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quizzes: true,
            questions: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }

    // Don't allow deletion if category has quizzes or questions
    if (category._count.quizzes > 0 || category._count.questions > 0) {
      return NextResponse.json(
        { error: 'Bu kategoriyi silemezsiniz. İçerinde testler veya sorular bulunuyor.' },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Kategori başarıyla silindi'
    })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Kategori silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}