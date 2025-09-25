import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isActive: true,
        quizAttempts: {
          select: {
            id: true,
            score: true,
            percentage: true,
            completedAt: true,
            maxScore: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the interface and calculate stats
    const transformedUsers = users.map(user => {
      const attempts = user.quizAttempts || []
      const completedAttempts = attempts.filter(a => a.completedAt)
      
      const stats = {
        totalQuizzes: attempts.length,
        totalScore: attempts.reduce((sum, a) => sum + (a.score || 0), 0),
        averagePercentage: completedAttempts.length > 0 
          ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
          : 0,
        completedTests: completedAttempts.length
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        lastLogin: undefined, // lastLogin field doesn't exist in schema
        isActive: user.isActive,
        stats
      }
    })

    const response = NextResponse.json(transformedUsers)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  } catch (error) {
    console.error('Error fetching users:', error)
    const response = NextResponse.json(
      { error: 'Kullanıcılar yüklenirken bir hata oluştu' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST(request: Request) {
  try {
    const { userId, action, userData } = await request.json()

    if (!userId || !action) {
      const response = NextResponse.json(
        { error: 'Geçersiz istek' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    let updatedUser

    switch (action) {
      case 'toggleStatus':
        updatedUser = await db.user.update({
          where: { id: userId },
          data: { isActive: { not: true } }
        })
        break

      case 'makeAdmin':
        updatedUser = await db.user.update({
          where: { id: userId },
          data: { role: 'ADMIN' }
        })
        break

      case 'removeAdmin':
        updatedUser = await db.user.update({
          where: { id: userId },
          data: { role: 'STUDENT' }
        })
        break

      case 'updateUser':
        if (!userData) {
          const response = NextResponse.json(
            { error: 'Kullanıcı verileri gerekli' },
            { status: 400 }
          )
          response.headers.set('Access-Control-Allow-Origin', '*')
          response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          return response
        }

        // Check if email is already taken by another user
        if (userData.email) {
          const existingUser = await db.user.findFirst({
            where: {
              email: userData.email,
              NOT: { id: userId }
            }
          })

          if (existingUser) {
            const response = NextResponse.json(
              { error: 'Bu e-posta adresi zaten kullanılıyor' },
              { status: 400 }
            )
            response.headers.set('Access-Control-Allow-Origin', '*')
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            return response
          }
        }

        updatedUser = await db.user.update({
          where: { id: userId },
          data: {
            ...(userData.name && { name: userData.name }),
            ...(userData.email && { email: userData.email }),
            ...(userData.role && { role: userData.role })
          }
        })
        break

      default:
        const response = NextResponse.json(
          { error: 'Geçersiz işlem' },
          { status: 400 }
        )
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response
    }

    const response = NextResponse.json({
      message: 'Kullanıcı başarıyla güncellendi',
      user: updatedUser
    })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  } catch (error) {
    console.error('Error updating user:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      const response = NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }
    
    const response = NextResponse.json(
      { error: 'Kullanıcı güncellenirken bir hata oluştu' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      const response = NextResponse.json(
        { error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    // Check if user exists first
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      const response = NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    // Use transaction to ensure atomic operation
    await db.$transaction(async (tx) => {
      // Delete related data first (in correct order to respect foreign key constraints)
      await tx.answer.deleteMany({
        where: { userId }
      })

      await tx.quizAttempt.deleteMany({
        where: { userId }
      })

      // Delete the user
      await tx.user.delete({
        where: { id: userId }
      })
    })

    const response = NextResponse.json({
      message: 'Kullanıcı başarıyla silindi'
    })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  } catch (error) {
    console.error('Error deleting user:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      const response = NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }
    
    const response = NextResponse.json(
      { error: 'Kullanıcı silinirken bir hata oluştu' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }
}