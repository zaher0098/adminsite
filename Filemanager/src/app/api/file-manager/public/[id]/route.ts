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

    // Return file with appropriate content type and CORS headers for Google Docs
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Failed to preview file:', error)
    return NextResponse.json(
      { error: 'Failed to preview file' },
      { status: 500 }
    )
  }
}