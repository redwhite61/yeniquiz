import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await db.user.upsert({
    where: { email: 'admin@quiz.com' },
    update: {},
    create: {
      email: 'admin@quiz.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 12)
  const student = await db.user.upsert({
    where: { email: 'student@quiz.com' },
    update: {},
    create: {
      email: 'student@quiz.com',
      name: 'Student User',
      password: studentPassword,
      role: 'STUDENT'
    }
  })

  await db.announcement.upsert({
    where: { id: 'default-announcement' },
    update: {},
    create: {
      id: 'default-announcement',
      title: 'QuizMaster Platform Güncellemeleri',
      content:
        'Yeni nesil öğrenme deneyimi için platformu sürekli geliştiriyoruz. Gelişmiş raporlama, canlı liderlik takibi ve kişiselleştirilmiş sınav akışları artık hazır.',
      icon: '📢',
      date: new Date()
    }
  })

  // Create categories
  const categories = await Promise.all([
    db.category.upsert({
      where: { name: 'Matematik' },
      update: {},
      create: {
        name: 'Matematik',
        description: 'Matematik testleri ve problemleri',
        color: '#3B82F6'
      }
    }),
    db.category.upsert({
      where: { name: 'Fen Bilgisi' },
      update: {},
      create: {
        name: 'Fen Bilgisi',
        description: 'Fen bilgisi testleri',
        color: '#10B981'
      }
    }),
    db.category.upsert({
      where: { name: 'Türkçe' },
      update: {},
      create: {
        name: 'Türkçe',
        description: 'Türkçe dil bilgisi ve anlama',
        color: '#8B5CF6'
      }
    }),
    db.category.upsert({
      where: { name: 'Tarih' },
      update: {},
      create: {
        name: 'Tarih',
        description: 'Tarih bilgisi testleri',
        color: '#EF4444'
      }
    }),
    db.category.upsert({
      where: { name: 'Coğrafya' },
      update: {},
      create: {
        name: 'Coğrafya',
        description: 'Coğrafya testleri',
        color: '#F59E0B'
      }
    }),
    db.category.upsert({
      where: { name: 'İngilizce' },
      update: {},
      create: {
        name: 'İngilizce',
        description: 'İngilizce testleri',
        color: '#6366F1'
      }
    })
  ])

  // Create sample questions
  const mathQuestions = [
    {
      content: '2 + 2 x 3 işleminin sonucu nedir?',
      type: 'MULTIPLE_CHOICE',
      options: ['8', '10', '12', '6'],
      correctAnswer: '1',
      points: 1,
      difficulty: 'EASY',
      categoryId: categories[0].id
    },
    {
      content: 'Bir üçgenin iç açıları toplamı kaç derecedir?',
      type: 'MULTIPLE_CHOICE',
      options: ['90°', '180°', '270°', '360°'],
      correctAnswer: '1',
      points: 1,
      difficulty: 'EASY',
      categoryId: categories[0].id
    },
    {
      content: '5! (5 faktöriyel) değeri nedir?',
      type: 'MULTIPLE_CHOICE',
      options: ['25', '120', '100', '50'],
      correctAnswer: '1',
      points: 2,
      difficulty: 'MEDIUM',
      categoryId: categories[0].id
    }
  ]

  const scienceQuestions = [
    {
      content: 'Suğun kimyasal formülü nedir?',
      type: 'MULTIPLE_CHOICE',
      options: ['CO2', 'H2O', 'O2', 'N2'],
      correctAnswer: '1',
      points: 1,
      difficulty: 'EASY',
      categoryId: categories[1].id
    },
    {
      content: 'Dünyanın uydusu hangisidir?',
      type: 'MULTIPLE_CHOICE',
      options: ['Mars', 'Venüs', 'Ay', 'Güneş'],
      correctAnswer: '2',
      points: 1,
      difficulty: 'EASY',
      categoryId: categories[1].id
    }
  ]

  const turkishQuestions = [
    {
      content: '"Güzel" kelimesinin zıt anlamlısı nedir?',
      type: 'MULTIPLE_CHOICE',
      options: ['Çirkin', 'Kısa', 'Uzun', 'Geniş'],
      correctAnswer: '0',
      points: 1,
      difficulty: 'EASY',
      categoryId: categories[2].id
    },
    {
      content: 'Aşağıdaki cümlelerden hangisi doğru yazılmıştır?',
      type: 'MULTIPLE_CHOICE',
      options: [
        'Okula gidiyorum.',
        'Okula gidiyom.',
        'Okula gidiyorum.',
        'Okula gidiyrum.'
      ],
      correctAnswer: '0',
      points: 1,
      difficulty: 'EASY',
      categoryId: categories[2].id
    }
  ]

  const allQuestions = [...mathQuestions, ...scienceQuestions, ...turkishQuestions]

  for (const questionData of allQuestions) {
    await db.question.create({
      data: {
        ...questionData,
        options: JSON.stringify(questionData.options)
      }
    })
  }

  // Create sample quizzes
  const mathQuiz = await db.quiz.create({
    data: {
      title: 'Matematik Temel Seviye',
      description: 'Temel matematik konuları',
      categoryId: categories[0].id,
      timeLimit: 30
    }
  })

  const scienceQuiz = await db.quiz.create({
    data: {
      title: 'Fen Bilgisi Orta Seviye',
      description: 'Fen bilimleri temel konuları',
      categoryId: categories[1].id,
      timeLimit: 25
    }
  })

  // Add questions to quizzes
  const mathQuestionsInDb = await db.question.findMany({
    where: { categoryId: categories[0].id }
  })

  const scienceQuestionsInDb = await db.question.findMany({
    where: { categoryId: categories[1].id }
  })

  for (let i = 0; i < mathQuestionsInDb.length; i++) {
    await db.quizQuestion.create({
      data: {
        quizId: mathQuiz.id,
        questionId: mathQuestionsInDb[i].id,
        order: i
      }
    })
  }

  for (let i = 0; i < scienceQuestionsInDb.length; i++) {
    await db.quizQuestion.create({
      data: {
        quizId: scienceQuiz.id,
        questionId: scienceQuestionsInDb[i].id,
        order: i
      }
    })
  }

  console.log('Database seeded successfully!')
  console.log('Admin user: admin@quiz.com / admin123')
  console.log('Student user: student@quiz.com / student123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })