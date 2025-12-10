import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const folders = await db.folder.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Failed to fetch folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, parentId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Build folder path
    let folderPath = name
    if (parentId) {
      const parentFolder = await db.folder.findUnique({
        where: { id: parentId }
      })
      if (parentFolder) {
        folderPath = path.join(parentFolder.path, name)
      }
    }

    // Check if folder already exists
    const existingFolder = await db.folder.findFirst({
      where: { path: folderPath }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder already exists' },
        { status: 409 }
      )
    }

    // Create folder in database
    const folder = await db.folder.create({
      data: {
        name,
        path: folderPath,
        parentId: parentId || null
      }
    })

    // Create physical folder
    const uploadsDir = path.join(process.cwd(), 'uploads', folderPath)
    await mkdir(uploadsDir, { recursive: true })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Failed to create folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}