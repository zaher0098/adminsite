import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const folderId = formData.get('folderId') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const fileId = uuidv4()
      const extension = file.name.split('.').pop()
      const fileName = `${fileId}.${extension}`
      
      // Get folder path
      let folderPath = ''
      if (folderId) {
        const folder = await db.folder.findUnique({
          where: { id: folderId }
        })
        if (folder) {
          folderPath = folder.path
        }
      }

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'uploads', folderPath)
      await mkdir(uploadDir, { recursive: true })

      // Save file to filesystem
      const filePath = path.join(uploadDir, fileName)
      await writeFile(filePath, buffer)

      // Save file info to database
      const fileRecord = await db.file.create({
        data: {
          id: fileId,
          name: fileName,
          originalName: file.name,
          path: path.join(folderPath, fileName),
          size: file.size,
          mimeType: file.type,
          extension: extension,
          folderId: folderId
        }
      })

      uploadedFiles.push(fileRecord)
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to upload files:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}