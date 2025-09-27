import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function serializeAnnouncement(announcement: any) {
  if (!announcement) {
    return null
  }

  return {
    ...announcement,
    date: announcement.date ? announcement.date.toISOString() : null,
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString()
  }
}

export async function GET() {
  try {
    const announcement = await db.announcement.findFirst({
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(serializeAnnouncement(announcement))
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json({ error: 'Duyuru yüklenemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, icon, date } = await request.json()

    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Başlık ve içerik alanları zorunludur.' },
        { status: 400 }
      )
    }

    let announcementDate: Date | null = null
    if (date) {
      const parsed = new Date(date)
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'Geçerli bir tarih giriniz.' },
          { status: 400 }
        )
      }
      announcementDate = parsed
    }

    const existing = await db.announcement.findFirst()

    const announcement = existing
      ? await db.announcement.update({
          where: { id: existing.id },
          data: {
            title: title.trim(),
            content: content.trim(),
            icon: icon?.toString().trim() || null,
            date: announcementDate
          }
        })
      : await db.announcement.create({
          data: {
            title: title.trim(),
            content: content.trim(),
            icon: icon?.toString().trim() || null,
            date: announcementDate
          }
        })

    return NextResponse.json(serializeAnnouncement(announcement))
  } catch (error) {
    console.error('Error saving announcement:', error)
    return NextResponse.json({ error: 'Duyuru kaydedilemedi' }, { status: 500 })
  }
}
