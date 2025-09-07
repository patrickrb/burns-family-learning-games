import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, difficulty, region, isCorrect } = await request.json()

    if (!email || !difficulty || !region) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Find or create game progress
    let gameProgress = await prisma.gameProgress.findFirst({
      where: {
        userId: user.id,
        difficulty,
        region,
      },
    })

    if (gameProgress) {
      // Update existing progress
      gameProgress = await prisma.gameProgress.update({
        where: { id: gameProgress.id },
        data: {
          attempts: gameProgress.attempts + 1,
          correctAnswers: isCorrect
            ? gameProgress.correctAnswers + 1
            : gameProgress.correctAnswers,
          score: isCorrect
            ? gameProgress.score + 10
            : gameProgress.score,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new progress
      gameProgress = await prisma.gameProgress.create({
        data: {
          userId: user.id,
          difficulty,
          region,
          attempts: 1,
          correctAnswers: isCorrect ? 1 : 0,
          score: isCorrect ? 10 : 0,
        },
      })
    }

    return NextResponse.json(gameProgress)
  } catch (error) {
    console.error("Error saving game progress:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        gameProgress: {
          orderBy: { updatedAt: "desc" },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user.gameProgress)
  } catch (error) {
    console.error("Error fetching game progress:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}