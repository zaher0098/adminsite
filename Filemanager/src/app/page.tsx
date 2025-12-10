'use client'

import { useState, useEffect } from 'react'
import { FileManager } from '@/components/FileManager'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <FileManager />
    </div>
  )
}