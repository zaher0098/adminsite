import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')

    const whereCondition = folderId ? { folderId } : { folderId: null }

    const files = await db.file.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error('Failed to fetch files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileIds } = await request.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'File IDs are required' },
        { status: 400 }
      )
    }

    // Get files to delete
    const filesToDelete = await db.file.findMany({
      where: {
        id: {
          in: fileIds
        }
      }
    })

    // Delete files from database
    await db.file.deleteMany({
      where: {
        id: {
          in: fileIds
        }
      }
    })

    // TODO: Delete physical files from filesystem
    // This would require importing fs/promises and unlink
    // For now, files are only removed from database

    return NextResponse.json({ 
      message: 'Files deleted successfully',
      deletedCount: filesToDelete.length 
    })
  } catch (error) {
    console.error('Failed to delete files:', error)
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    )
  }
}