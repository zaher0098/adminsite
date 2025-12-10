'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'

interface FolderTreeProps {
  folders: FolderItem[]
  currentFolder: string | null
  onFolderSelect: (folderId: string | null) => void
}

interface FolderItem {
  id: string
  name: string
  path: string
  parentId?: string
  createdAt: string
  updatedAt: string
}

export function FolderTree({ folders, currentFolder, onFolderSelect }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Build folder hierarchy
  const buildTree = (folders: FolderItem[]) => {
    const folderMap = new Map<string, FolderItem & { children: FolderItem[] }>()
    
    // Initialize all folders with empty children array
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    // Build hierarchy
    const rootFolders: (FolderItem & { children: FolderItem[] })[] = []
    
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId)
        if (parent) {
          parent.children.push(folderWithChildren)
        }
      } else {
        rootFolders.push(folderWithChildren)
      }
    })

    return rootFolders
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (folder: FolderItem & { children: FolderItem[] }, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = currentFolder === folder.id
    const hasChildren = folder.children.length > 0

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center space-x-1 space-x-reverse py-1 px-2 rounded cursor-pointer hover:bg-accent ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingRight: `${level * 16 + 8}px` }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 justify-start h-8 px-1 ${
              isSelected ? 'bg-primary text-primary-foreground' : ''
            }`}
            onClick={() => onFolderSelect(folder.id)}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 ml-2" />
            ) : (
              <Folder className="h-4 w-4 ml-2" />
            )}
            <span className="truncate">{folder.name}</span>
          </Button>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const folderTree = buildTree(folders)

  return (
    <ScrollArea className="h-96">
      <div className="space-y-1">
        {/* Root folder option */}
        <div
          className={`flex items-center space-x-2 space-x-reverse py-1 px-2 rounded cursor-pointer hover:bg-accent ${
            currentFolder === null ? 'bg-accent' : ''
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <Folder className="h-4 w-4" />
          <span>ریشه</span>
        </div>
        
        {folderTree.map(folder => renderFolder(folder))}
      </div>
    </ScrollArea>
  )
}