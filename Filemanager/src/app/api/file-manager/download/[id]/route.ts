import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import path from 'path'
import { getFilePath } from '@/lib/upload-path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params

    // Get file info from database
    const file = await db.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file from filesystem
    const filePath = getFilePath(file.path)
    const fileBuffer = await readFile(filePath)

    // Return file as download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })

  } catch (error) {
    console.error('Failed to download file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}