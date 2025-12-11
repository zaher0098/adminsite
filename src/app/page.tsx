'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SketchPicker } from 'react-color'
import { FileManager } from '@/components/FileManager'
import dynamic from 'next/dynamic'
import SimplePostEditor from '@/components/canvas-editor/SimplePostEditor'
import { Plus, Edit } from 'lucide-react'

const AdvancedCanvasEditor = dynamic(() => import('@/components/canvas-editor/AdvancedCanvasEditor'), { ssr: false })

interface Wallpaper {
  id: string
  url: string
  width: number
  height: number
  opacity: number
}

interface TabSettings {
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
  navigationColor: string
  navigationTextColor: string
  navigationOpacity: number
  opacity: number
  containerOpacity?: number
  blur: number
  wallpapers: Wallpaper[]
  containerBackgroundColor?: string
  wallpaperMode?: 'floating' | 'cover'
}

interface GlobalSettings {
  [key: string]: TabSettings
}

interface Post {
  id: string
  title: string
  content: string
  description: string
  image: string
  author: string
  date: string
  canvasData?: string
  background?: string
  blurAmount?: number
  pdfUrl?: string
  published?: boolean
}

interface Project {
  id: string
  title: string
  description: string
  imageUrl: string
  repoUrl: string
}

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [settings, setSettings] = useState<GlobalSettings>({})
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('home')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState('Admin@123456')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)
  const imageUrlRef = useRef<HTMLInputElement>(null)
  const repoUrlRef = useRef<HTMLInputElement>(null)
  const aboutImageRef = useRef<HTMLInputElement>(null)
  
  const [aboutContent, setAboutContent] = useState({
    title: 'About Us',
    description: 'Welcome to our amazing platform. We are dedicated to providing the best service possible.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop'
  })


  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        const mappedPosts = data.map((p: any) => ({
          ...p,
          author: p.authorId || 'Admin',
          date: new Date(p.createdAt).toLocaleDateString(),
          image: p.image || 'https://via.placeholder.com/150',
          description: p.description || '',
          content: p.content || ''
        }))
        setPosts(mappedPosts)
        if (data.length > 0 && !selectedPost) {
          setSelectedPost(data[data.length - 1])
        }
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    }
  }

  const handleSavePost = async (post: Post) => {
    try {
      const method = post.id && posts.some(p => p.id === post.id) ? 'PUT' : 'POST'
      const url = method === 'PUT' ? `/api/posts/${post.id}` : '/api/posts'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })

      if (response.ok) {
        fetchPosts()
        toast({
          title: "Success",
          description: "Post saved successfully",
        })
      }
    } catch (error) {
      console.error('Failed to save post:', error)
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      })
    }
  }

  const handleDeletePost = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPosts()
        if (selectedPost?.id === id) {
          setSelectedPost(null)
        }
        toast({
          title: "Success",
          description: "Post deleted successfully",
        })
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (selectedPost === null && posts.length > 0) {
      setSelectedPost(posts[posts.length - 1])
    }
  }, [])

  const defaultSettings: GlobalSettings = {
    home: {
      backgroundColor: '#ffffff',
      containerBackgroundColor: '#ffffff',
      containerOpacity: 1,
      textColor: '#1f2937',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      navigationColor: '#ffffff',
      navigationTextColor: '#1f2937',
      navigationOpacity: 0.95,
      opacity: 0.85,
      blur: 10,
      wallpapers: []
      , wallpaperMode: 'floating'
    },
    about: {
      backgroundColor: '#f3f4f6',
      containerBackgroundColor: '#ffffff',
      containerOpacity: 1,
      textColor: '#1f2937',
      buttonColor: '#10b981',
      buttonTextColor: '#ffffff',
      navigationColor: '#ffffff',
      navigationTextColor: '#1f2937',
      navigationOpacity: 0.95,
      opacity: 0.85,
      blur: 10,
      wallpapers: []
      , wallpaperMode: 'floating'
    },
    projects: {
      backgroundColor: '#fef3c7',
      containerBackgroundColor: '#ffffff',
      containerOpacity: 1,
      textColor: '#92400e',
      buttonColor: '#f59e0b',
      buttonTextColor: '#ffffff',
      navigationColor: '#ffffff',
      navigationTextColor: '#92400e',
      navigationOpacity: 0.95,
      opacity: 0.85,
      blur: 10,
      wallpapers: []
      , wallpaperMode: 'floating'
    },
    contact: {
      backgroundColor: '#e0e7ff',
      containerBackgroundColor: '#ffffff',
      containerOpacity: 1,
      textColor: '#312e81',
      buttonColor: '#6366f1',
      buttonTextColor: '#ffffff',
      navigationColor: '#ffffff',
      navigationTextColor: '#312e81',
      navigationOpacity: 0.95,
      opacity: 0.85,
      blur: 10,
      wallpapers: []
      , wallpaperMode: 'floating'
    },
    'manage-projects': {
      backgroundColor: '#f3e8ff',
      containerBackgroundColor: '#ffffff',
      containerOpacity: 1,
      textColor: '#581c87',
      buttonColor: '#9333ea',
      buttonTextColor: '#ffffff',
      navigationColor: '#ffffff',
      navigationTextColor: '#581c87',
      navigationOpacity: 0.95,
      opacity: 0.85,
      blur: 10,
      wallpapers: [],
      wallpaperMode: 'floating'
    },
    'file-manager': {
      backgroundColor: '#fef3c7',
      containerBackgroundColor: '#ffffff',
      containerOpacity: 1,
      textColor: '#78350f',
      buttonColor: '#f59e0b',
      buttonTextColor: '#ffffff',
      navigationColor: '#ffffff',
      navigationTextColor: '#78350f',
      navigationOpacity: 0.95,
      opacity: 0.85,
      blur: 10,
      wallpapers: [],
      wallpaperMode: 'floating'
    },
    'editor': {
      backgroundColor: '#dbeafe',
      containerBackgroundColor: '#ffffff',
      containerOpacity: 1,
      textColor: '#1e3a8a',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      navigationColor: '#ffffff',
      navigationTextColor: '#1e3a8a',
      navigationOpacity: 0.95,
      opacity: 0.85,
      blur: 10,
      wallpapers: [],
      wallpaperMode: 'floating'
    }
  }

  const hexToRgba = (hex: string, alpha = 1) => {
    if (!hex) return `rgba(0, 0, 0, ${alpha})`
    const h = hex.replace('#', '')
    const bigint = parseInt(h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('tabSettings')
      if (saved) {
        setSettings(JSON.parse(saved))
      } else {
        setSettings(defaultSettings)
      }
      const savedPassword = localStorage.getItem('adminPassword')
      if (savedPassword) {
        setAdminPassword(savedPassword)
      }
      const savedAbout = localStorage.getItem('aboutContent')
      if (savedAbout) {
        setAboutContent(JSON.parse(savedAbout))
      }
    } catch {
      setSettings(defaultSettings)
    }
  }, [])

  const saveSettings = (newSettings: GlobalSettings) => {
    setSettings(newSettings)
    localStorage.setItem('tabSettings', JSON.stringify(newSettings))
    toast.success('Settings saved ✓')
  }

  const updateSetting = (tab: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [tab]: {
        ...settings[tab],
        [key]: value
      }
    }
    saveSettings(newSettings)
  }

  const addWallpaper = (tab: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل باید کمتر از 5MB باشد')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      const newWallpaper: Wallpaper = {
        id: Date.now().toString(),
        url,
        width: 150,
        height: 150,
        opacity: 1
      }

      const wallpapers = [...(settings[tab]?.wallpapers || []), newWallpaper]
      updateSetting(tab, 'wallpapers', wallpapers)
      toast.success('Wallpaper added ✓')
    }
    reader.readAsDataURL(file)
  }

  const removeWallpaper = (tab: string, id: string) => {
    const wallpapers = (settings[tab]?.wallpapers || []).filter(w => w.id !== id)
    updateSetting(tab, 'wallpapers', wallpapers)
    toast.success('Wallpaper deleted ✓')
  }

  const updateWallpaper = (tab: string, id: string, key: string, value: any) => {
    const wallpapers = (settings[tab]?.wallpapers || []).map(w =>
      w.id === id ? { ...w, [key]: value } : w
    )
    updateSetting(tab, 'wallpapers', wallpapers)
  }

  const addProject = () => {
    const title = titleRef.current?.value.trim() || ''
    const description = descriptionRef.current?.value.trim() || ''
    const repoUrl = repoUrlRef.current?.value.trim() || ''
    const fileInput = imageUrlRef.current
    
    if (!title) {
      toast.error('Project title is required')
      return
    }
    
    // Get uploaded image or use placeholder
    let imageUrl = 'https://via.placeholder.com/100'
    
    if (fileInput?.files && fileInput.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newProject: Project = {
          id: Date.now().toString(),
          title,
          description,
          imageUrl: e.target?.result as string,
          repoUrl
        }
        setProjects(prev => [...prev, newProject])
        
        // Clear inputs
        if (titleRef.current) titleRef.current.value = ''
        if (descriptionRef.current) descriptionRef.current.value = ''
        if (imageUrlRef.current) imageUrlRef.current.value = ''
        if (repoUrlRef.current) repoUrlRef.current.value = ''
        
        toast.success('Project added successfully ✓')
      }
      reader.readAsDataURL(fileInput.files[0])
    } else {
      const newProject: Project = {
        id: Date.now().toString(),
        title,
        description,
        imageUrl,
        repoUrl
      }
      setProjects([...projects, newProject])
      
      // Clear inputs
      if (titleRef.current) titleRef.current.value = ''
      if (descriptionRef.current) descriptionRef.current.value = ''
      if (imageUrlRef.current) imageUrlRef.current.value = ''
      if (repoUrlRef.current) repoUrlRef.current.value = ''
      
      toast.success('Project added successfully ✓')
    }
  }

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id))
    toast.success('Project deleted ✓')
  }

  if (!mounted) return null

  const TabContent = ({ tabName }: { tabName: string }) => {
    const s = settings[tabName] || defaultSettings[tabName]

    return (
      <TabsContent value={tabName} className="mt-8">
        {isAdmin && tabName !== 'manage-projects' && tabName !== 'file-manager' && tabName !== 'editor' && (
          <Card className="mb-8 bg-white/90 shadow-md rounded-lg">
            <CardHeader className="bg-transparent border-b">
              <CardTitle className="text-2xl" style={{ color: s.navigationTextColor }}>⚙️ پنل مدیریت تب: {tabName}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* رنگ‌ها */}
              <div className="border-b pb-6">
                <h3 className="text-xl font-bold mb-4">🎨 رنگ‌ها</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'backgroundColor', label: 'Page Background' },
                    { key: 'containerBackgroundColor', label: 'Container Background' },
                    { key: 'textColor', label: 'متن' },
                    { key: 'buttonColor', label: 'Button Color' },
                    { key: 'buttonTextColor', label: 'Button Text' },
                    { key: 'navigationColor', label: 'Navigation Background' },
                    { key: 'navigationTextColor', label: 'Navigation Text' }
                  ].map(({ key, label }) => (
                    <div key={key} className="p-3 bg-gray-50/80 rounded-lg border border-gray-200 relative">
                      <Label className="font-bold">{label}</Label>
                      <div className="flex gap-2 mt-2 items-center">
                        {/* Color Preview */}
                        <button
                          onClick={() => setOpenColorPicker(openColorPicker === key ? null : key)}
                          style={{ backgroundColor: (s as any)[key] || '#ffffff' }}
                          className="w-16 h-10 border-2 border-gray-400 rounded cursor-pointer shadow-md hover:shadow-lg transition"
                          title="Click to open color picker"
                        />
                        
                        {/* Hex Input */}
                        <Input
                          value={(s as any)[key]}
                          onChange={(e) => {
                            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                              updateSetting(tabName, key, e.target.value)
                            }
                          }}
                          className="flex-1 border-2"
                          placeholder="#ffffff"
                        />
                      </div>

                      {/* Color Picker Dropdown */}
                      {openColorPicker === key && (
                        <div className="absolute top-full left-0 z-50 mt-2 bg-white rounded-lg shadow-2xl p-4 border border-gray-200">
                          <SketchPicker
                            color={(s as any)[key] || '#ffffff'}
                            onChange={(color) => updateSetting(tabName, key, color.hex)}
                            width="250px"
                          />
                          <button
                            onClick={() => setOpenColorPicker(null)}
                            className="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md text-sm font-bold"
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* اسلایدرها */}
              <div className="border-b pb-6">
                <h3 className="text-xl font-bold mb-4">📊 افکت‌ها</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div key="bg-opacity" className="p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                    <Label className="font-bold">Background Opacity: {Math.round((s.opacity ?? 0.85) * 100)}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round((s.opacity ?? 0.85) * 100)}
                      onChange={(e) => updateSetting(tabName, 'opacity', Number(e.target.value) / 100)}
                      className="w-full mt-2"
                    />
                  </div>

                  <div key="blur" className="p-3 bg-purple-50/70 rounded-lg border border-purple-100">
                    <Label className="font-bold">تاری: {(s.blur ?? 10)}px</Label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={s.blur}
                      onChange={(e) => updateSetting(tabName, 'blur', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div key="nav-opacity" className="p-3 bg-green-50/70 rounded-lg border border-green-100">
                    <Label className="font-bold">Navigation Opacity: {Math.round(s.navigationOpacity * 100)}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(s.navigationOpacity * 100)}
                      onChange={(e) => updateSetting(tabName, 'navigationOpacity', Number(e.target.value) / 100)}
                      className="w-full mt-2"
                    />
                  </div>
                  <div key="container-opacity" className="p-3 bg-yellow-50/70 rounded-lg border border-yellow-100">
                    <Label className="font-bold">Container Opacity: {Math.round((s.containerOpacity ?? 1) * 100)}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round((s.containerOpacity ?? 1) * 100)}
                      onChange={(e) => updateSetting(tabName, 'containerOpacity', Number(e.target.value) / 100)}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* والپیپرها */}
              <div>
                <h3 className="text-xl font-bold mb-4">🖼️ والپیپرها</h3>
                <div className="mb-4">
                  <Label className="font-bold">Wallpaper Mode</Label>
                  <select
                    value={s.wallpaperMode || 'floating'}
                    onChange={(e) => updateSetting(tabName, 'wallpaperMode', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="floating">Floating</option>
                    <option value="cover">Cover (Full Page)</option>
                  </select>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && addWallpaper(tabName, e.target.files[0])}
                  className="hidden"
                  id={`file-${tabName}`}
                />
                <Button
                  onClick={() => document.getElementById(`file-${tabName}`)?.click()}
                  className="w-full bg-yellow-500/90 hover:bg-yellow-600 text-white font-medium mb-4"
                >
                  📁 Upload Wallpaper
                </Button>

                <div className="space-y-3">
                  {(s.wallpapers || []).map((wp) => (
                    <div key={wp.id} className="rounded-lg p-4 bg-gray-50/90 shadow-sm">
                      <div className="flex gap-4 mb-4">
                        <img src={wp.url} alt="wallpaper" className="w-20 h-20 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-bold">{wp.width}x{wp.height}px</p>
                          <p className="text-sm">Opacity: {Math.round(wp.opacity * 100)}%</p>
                          <Button
                            onClick={() => removeWallpaper(tabName, wp.id)}
                            size="sm"
                            className="mt-2 bg-red-500/90 hover:bg-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      { (s.wallpaperMode || 'floating') === 'floating' ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div key={`${wp.id}-width`}>
                            <Label className="text-xs">Width: {wp.width}px</Label>
                            <input
                              type="range"
                              min="50"
                              max="400"
                              value={wp.width}
                              onChange={(e) => updateWallpaper(tabName, wp.id, 'width', Number(e.target.value))}
                              className="w-full mt-1"
                            />
                          </div>
                          <div key={`${wp.id}-height`}>
                            <Label className="text-xs">Height: {wp.height}px</Label>
                            <input
                              type="range"
                              min="50"
                              max="400"
                              value={wp.height}
                              onChange={(e) => updateWallpaper(tabName, wp.id, 'height', Number(e.target.value))}
                              className="w-full mt-1"
                            />
                          </div>
                          <div key={`${wp.id}-opacity`}>
                            <Label className="text-xs">Opacity: {Math.round(wp.opacity * 100)}%</Label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={Math.round(wp.opacity * 100)}
                              onChange={(e) => updateWallpaper(tabName, wp.id, 'opacity', Number(e.target.value) / 100)}
                              className="w-full mt-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs">Opacity (Cover): {Math.round(wp.opacity * 100)}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(wp.opacity * 100)}
                            onChange={(e) => updateWallpaper(tabName, wp.id, 'opacity', Number(e.target.value) / 100)}
                            className="w-full mt-1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout for Home Tab Only */}
        {tabName === 'home' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '70vh' }}>
            {/* Top: Posts List */}
            <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'visible', backgroundColor: hexToRgba(s.containerBackgroundColor || s.backgroundColor, s.containerOpacity ?? 0.9) }}>
              <div style={{
                position: 'relative',
                zIndex: 3,
                padding: '1.5rem',
                color: s.textColor,
                maxHeight: '320px',
                overflowY: 'auto'
              }} className="scrollbar-thin scrollbar-thumb-gray-400">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">📰 Posts</h3>
                  {isAdmin && (
                    <SimplePostEditor 
                      authorId="Admin" 
                      onSave={handleSavePost} 
                      trigger={
                        <Button size="sm" variant="outline" style={{ color: s.buttonColor, borderColor: s.buttonColor }}>
                          <Plus className="w-4 h-4 mr-2" /> Add Post
                        </Button>
                      } 
                    />
                  )}
                </div>
                <div className="space-y-3">
                  {posts.map((post) => (
                    <Card 
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      style={{ 
                        borderColor: s.buttonColor, 
                        backgroundColor: hexToRgba(s.buttonColor, selectedPost?.id === post.id ? 0.15 : 0.05),
                        cursor: 'pointer'
                      }} 
                      className="hover:shadow-md transition"
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <img 
                            src={post.image} 
                            alt={post.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0 }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2" style={{ color: s.buttonColor }}>{post.title}</h4>
                            <p className="text-xs mt-1 opacity-75 line-clamp-2">{post.description}</p>
                            <p className="text-xs opacity-50 mt-1">{post.date}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Post Display */}
            <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'visible' }}>
              {/* Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: hexToRgba(s.backgroundColor, s.opacity),
                zIndex: 1
              }} />

              {/* Wallpapers */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
                { (s.wallpaperMode || 'floating') === 'cover' && s.wallpapers?.[0] ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${s.wallpapers?.[0]?.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: s.wallpapers?.[0]?.opacity || 1,
                      zIndex: 2
                    }}
                  />
                ) : (
                  (s.wallpapers || []).map((wp) => (
                    <div
                      key={wp.id}
                      style={{
                        position: 'absolute',
                        backgroundImage: `url(${wp.url})`,
                        backgroundSize: 'cover',
                        width: `${wp.width}px`,
                        height: `${wp.height}px`,
                        opacity: wp.opacity,
                        left: `${Math.random() * 80}%`,
                        top: `${Math.random() * 80}%`,
                        borderRadius: '12px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                      }}
                    />
                  ))
                )}
              </div>

              {/* Content */}
              <div style={{
                position: 'relative',
                zIndex: 3,
                padding: '2rem',
                color: s.textColor,
                minHeight: '1000px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                backgroundColor: hexToRgba(s.containerBackgroundColor || s.backgroundColor, s.containerOpacity ?? 1),
                borderRadius: '0.75rem',
                overflowY: 'auto',
                paddingRight: '2.5rem' // leave room for scrollbar
              }}>
                {selectedPost && (
                  <div className="text-center space-y-4">
                    {selectedPost.canvasData ? (
                      <div className="h-[500px] w-full border rounded-lg overflow-hidden relative bg-white">
                        <AdvancedCanvasEditor
                          initialData={(() => {
                            try {
                              return JSON.parse(selectedPost.canvasData).elements || []
                            } catch (e) { return [] }
                          })()}
                          background={(() => {
                            try {
                              return JSON.parse(selectedPost.canvasData).background || ''
                            } catch (e) { return '' }
                          })()}
                          blurAmount={(() => {
                            try {
                              return JSON.parse(selectedPost.canvasData).blurAmount || 0
                            } catch (e) { return 0 }
                          })()}
                          onSave={() => {}}
                          onCancel={() => {}}
                          showSaveControls={false}
                          readOnly={true}
                        />
                      </div>
                    ) : (
                      <img 
                        src={selectedPost.image} 
                        alt={selectedPost.title}
                        style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '0.5rem' }}
                      />
                    )}
                    <h2 className="text-3xl font-bold">{selectedPost.title}</h2>
                    <p className="text-lg opacity-90 leading-relaxed">{selectedPost.description}</p>
                    <p className="text-base opacity-90 leading-relaxed">{selectedPost.content}</p>
                    <div className="text-sm opacity-75 pt-4 border-t" style={{ borderColor: s.buttonColor + '40' }}>
                      <p><span className="font-semibold">{selectedPost.author}</span> • {selectedPost.date}</p>
                      {selectedPost.pdfUrl && (
                        <a 
                          href={selectedPost.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 hover:underline"
                        >
                          📄 Download PDF
                        </a>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 mt-4">
                        <SimplePostEditor 
                          post={selectedPost} 
                          authorId="Admin" 
                          onSave={handleSavePost} 
                          trigger={
                            <Button variant="outline" className="flex-1">
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </Button>
                          } 
                        />
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleDeletePost(selectedPost.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : tabName === 'projects' ? (
          /* Projects Grid Layout */
          <div style={{ position: 'relative', minHeight: '70vh', borderRadius: '1rem', overflow: 'hidden' }}>
            {/* Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: hexToRgba(s.backgroundColor, s.opacity),
              zIndex: 1
            }} />

            {/* Wallpapers */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
              { (s.wallpaperMode || 'floating') === 'cover' && s.wallpapers?.[0] ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${s.wallpapers?.[0]?.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: s.wallpapers?.[0]?.opacity || 1,
                    zIndex: 2
                  }}
                />
              ) : (
                (s.wallpapers || []).map((wp) => (
                  <div
                    key={wp.id}
                    style={{
                      position: 'absolute',
                      backgroundImage: `url(${wp.url})`,
                      backgroundSize: 'cover',
                      width: `${wp.width}px`,
                      height: `${wp.height}px`,
                      opacity: wp.opacity,
                      left: `${Math.random() * 80}%`,
                      top: `${Math.random() * 80}%`,
                      borderRadius: '12px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                    }}
                  />
                ))
              )}
            </div>

            {/* Projects Grid Content */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              padding: '3rem 2rem',
              color: s.textColor,
              minHeight: '70vh',
              backgroundColor: hexToRgba(s.containerBackgroundColor || s.backgroundColor, s.containerOpacity ?? 1),
              borderRadius: '0.75rem'
            }}>
              <h2 className="text-4xl font-bold mb-8 text-center">🚀 Projects</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1.5rem' 
              }}>
                {projects.length === 0 ? (
                  <div className="col-span-3 text-center py-12 opacity-75">
                    <p className="text-xl">هیچ پروژه‌ای یافت نشد</p>
                    <p className="text-sm mt-2">برای افزودن پروژه، وارد پنل مدیریت شوید</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <Card 
                      key={project.id}
                      style={{ 
                        borderColor: s.buttonColor, 
                        backgroundColor: hexToRgba(s.buttonColor, 0.06),
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        cursor: 'pointer'
                      }}
                      className="hover:shadow-lg transition"
                    >
                      <CardContent className="pt-6">
                        <div style={{ 
                          width: '100%', 
                          height: '180px', 
                          backgroundColor: hexToRgba(s.buttonColor, 0.15),
                          borderRadius: '0.5rem',
                          marginBottom: '1rem',
                          overflow: 'hidden'
                        }}>
                          <img 
                            src={project.imageUrl} 
                            alt={project.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/100'
                            }}
                          />
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: s.buttonColor }}>{project.title}</h3>
                        <p className="text-sm" style={{ color: '#000000' }}>{project.description}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : tabName === 'manage-projects' ? (
          /* Manage Projects Tab */
          <div style={{ position: 'relative', minHeight: '70vh', borderRadius: '1rem', overflow: 'hidden' }}>
            {/* Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: hexToRgba(s.backgroundColor, s.opacity),
              zIndex: 1
            }} />

            {/* Wallpapers */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
              { (s.wallpaperMode || 'floating') === 'cover' && s.wallpapers?.[0] ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${s.wallpapers?.[0]?.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: s.wallpapers?.[0]?.opacity || 1,
                    zIndex: 2
                  }}
                />
              ) : (
                (s.wallpapers || []).map((wp) => (
                  <div
                    key={wp.id}
                    style={{
                      position: 'absolute',
                      backgroundImage: `url(${wp.url})`,
                      backgroundSize: 'cover',
                      width: `${wp.width}px`,
                      height: `${wp.height}px`,
                      opacity: wp.opacity,
                      left: `${Math.random() * 80}%`,
                      top: `${Math.random() * 80}%`,
                      borderRadius: '12px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                    }}
                  />
                ))
              )}
            </div>

            {/* Manage Projects Content */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              padding: '3rem 2rem',
              color: s.textColor,
              minHeight: '70vh',
              backgroundColor: hexToRgba(s.containerBackgroundColor || s.backgroundColor, s.containerOpacity ?? 1),
              borderRadius: '0.75rem'
            }}>
              <h2 className="text-4xl font-bold mb-8 text-center">⚙️ Manage Projects</h2>
              
              {/* Add Project Form */}
              <Card className="mb-8" style={{ backgroundColor: hexToRgba(s.buttonColor, 0.06) }}>
                <CardHeader>
                  <CardTitle style={{ color: s.buttonColor }}>➕ Add New Project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div key="project-title-field">
                    <Label htmlFor="title">Project Name</Label>
                    <Input
                      ref={titleRef}
                      id="title"
                      type="text"
                      placeholder="Enter project name"
                      style={{ borderColor: s.buttonColor }}
                      autoComplete="off"
                    />
                  </div>
                  <div key="project-description-field">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      ref={descriptionRef}
                      id="description"
                      type="text"
                      placeholder="Enter project description"
                      style={{ borderColor: s.buttonColor }}
                      autoComplete="off"
                    />
                  </div>
                  <div key="project-icon-field">
                    <Label htmlFor="imageUrl">Project Image</Label>
                    <Input
                      ref={imageUrlRef}
                      id="imageUrl"
                      type="file"
                      accept="image/*"
                      style={{ borderColor: s.buttonColor }}
                      autoComplete="off"
                    />
                  </div>
                  <div key="project-repo-field">
                    <Label htmlFor="repoUrl">Repository URL</Label>
                    <Input
                      ref={repoUrlRef}
                      id="repoUrl"
                      type="text"
                      placeholder="https://github.com/username/repo"
                      style={{ borderColor: s.buttonColor }}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    onClick={addProject}
                    style={{ backgroundColor: s.buttonColor, color: s.buttonTextColor }}
                    className="w-full"
                  >
                    Add Project
                  </Button>
                </CardContent>
              </Card>

              {/* Projects List */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold" style={{ color: s.buttonColor }}>📋 Projects List</h3>
                {projects.length === 0 ? (
                  <p className="text-center opacity-75 py-8">No projects found</p>
                ) : (
                  projects.map((project) => (
                    <Card key={project.id} style={{ 
                      borderColor: s.buttonColor,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={project.imageUrl} 
                            alt={project.title}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/100'
                            }}
                          />
                          <div>
                            <h4 className="text-xl font-bold" style={{ color: s.buttonColor }}>{project.title}</h4>
                            <p className="text-sm line-clamp-2 max-w-md" style={{ color: '#000000' }}>{project.description}</p>
                            {project.repoUrl && (
                              <a 
                                href={project.repoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm underline hover:opacity-80"
                                style={{ color: s.buttonColor }}
                              >
                                {project.repoUrl}
                              </a>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => deleteProject(project.id)}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : tabName === 'file-manager' ? (
          /* File Manager Tab - Direct Component */
          <div style={{ position: 'relative', minHeight: '70vh', borderRadius: '1rem', overflow: 'hidden' }}>
            <FileManager />
          </div>
        ) : tabName === 'editor' ? (
          /* Editor Tab - Direct Component */
          <div style={{ 
            position: 'relative', 
            minHeight: '70vh', 
            maxHeight: '85vh',
            borderRadius: '1rem', 
            overflow: 'hidden',
            backgroundColor: 'white',
            padding: '0'
          }}>
            <AdvancedCanvasEditor 
              onSave={(elements, background, blurAmount) => {
                console.log('Canvas saved:', { elements, background, blurAmount })
                toast.success('Canvas saved successfully!')
              }}
              onCancel={() => {
                console.log('Canvas editing cancelled')
              }}
            />
          </div>
        ) : (
          /* Content for other tabs */
          <div style={{ position: 'relative', minHeight: '70vh', borderRadius: '1rem', overflow: 'hidden' }}>
          {/* Overlay placed behind wallpapers and content container so container background remains visible */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: hexToRgba(s.backgroundColor, s.opacity),
            zIndex: 1
          }} />

          {/* Wallpapers (between overlay and content container) */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
            { (s.wallpaperMode || 'floating') === 'cover' && s.wallpapers?.[0] ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${s.wallpapers?.[0]?.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: s.wallpapers?.[0]?.opacity || 1,
                  zIndex: 2
                }}
              />
            ) : (
              (s.wallpapers || []).map((wp) => (
                <div
                  key={wp.id}
                  style={{
                    position: 'absolute',
                    backgroundImage: `url(${wp.url})`,
                    backgroundSize: 'cover',
                    width: `${wp.width}px`,
                    height: `${wp.height}px`,
                    opacity: wp.opacity,
                    left: `${Math.random() * 80}%`,
                    top: `${Math.random() * 80}%`,
                    borderRadius: '12px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
                  }}
                />
              ))
            )}
          </div>

          {/* Content container (on top) */}
          <div style={{
            position: 'relative',
            zIndex: 3,
            padding: '3rem 2rem',
            color: s.textColor,
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: hexToRgba(s.containerBackgroundColor || s.backgroundColor, s.containerOpacity ?? 1),
            borderRadius: '0.75rem'
          }}>
            {tabName === 'about' ? (
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-center mb-8">{aboutContent.title}</h2>
                {aboutContent.image && (
                  <img 
                    src={aboutContent.image} 
                    alt={aboutContent.title}
                    style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '0.75rem', marginBottom: '2rem' }}
                  />
                )}
                <p className="text-lg leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{aboutContent.description}</p>
              </div>
            ) : (
            <div className="text-center space-y-6">
              <h2 className="text-5xl font-bold">Tab {tabName}</h2>
              <p className="text-xl">Page content</p>
              <Card style={{ borderColor: s.buttonColor, backgroundColor: hexToRgba(s.buttonColor, 0.06) }}>
                <CardContent className="pt-6">
                  <p>Button Color: <span style={{ color: s.buttonColor }} className="font-bold">{s.buttonColor}</span></p>
                </CardContent>
              </Card>
              <div>
                <button
                  onClick={() => toast('Clicked!')}
                  style={{ backgroundColor: s.buttonColor, color: s.buttonTextColor }}
                  className="rounded-md text-lg px-8 py-3 mt-4 shadow"
                >
                  🚀 Button {tabName}
                </button>
              </div>
            </div>
            )}
          </div>
          </div>
        )}
      </TabsContent>
    )
  }

  const navOpacity = settings[activeTab]?.navigationOpacity ?? settings.home?.navigationOpacity ?? 0.95

  const handlePasswordSubmit = () => {
    if (passwordInput === adminPassword) {
      setIsAdmin(true)
      setShowPasswordDialog(false)
      setPasswordInput('')
      toast.success('Admin access granted ✓')
    } else {
      toast.error('Incorrect password!')
      setPasswordInput('')
    }
  }

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast.error('Enter current password')
      return
    }
    if (currentPassword !== adminPassword) {
      toast.error('Current password is incorrect')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword === currentPassword) {
      toast.error('New password must be different from current')
      return
    }
    setAdminPassword(newPassword)
    localStorage.setItem('adminPassword', newPassword)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Password changed successfully ✓')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: settings[activeTab]?.backgroundColor || 'var(--color-gray-100)' }}>
      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-sm">
            <h2 className="text-2xl font-bold mb-4">🔐 Admin Password</h2>
            <input
              type="password"
              placeholder="Enter admin password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className="w-full p-2 border rounded-md mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-md"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowPasswordDialog(false)
                  setPasswordInput('')
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className="sticky top-0 z-[100] p-4 mb-8 shadow-xl"
        style={{
          backgroundColor: hexToRgba(settings[activeTab]?.navigationColor || settings.home?.navigationColor || '#ffffff', navOpacity),
          color: settings[activeTab]?.navigationTextColor || settings.home?.navigationTextColor || '#000',
          backdropFilter: 'blur(10px)',
          borderBottom: '2px solid rgba(0,0,0,0.06)'
        }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">🎨 Customization Site</h1>
          <div
            className="inline-flex items-center rounded-md px-2 py-1"
            style={{ backgroundColor: 'transparent', backdropFilter: 'none' }}
          >
            <div className="flex items-center space-x-2 mr-2">
              {['home', 'about', 'projects', 'contact', ...(isAdmin ? ['manage-projects', 'file-manager', 'editor'] : [])].map((t) => {
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`rounded-md px-4 py-2 text-lg font-bold shadow ${activeTab === t ? 'shadow-sm' : 'hover:brightness-95'}`}
                    style={{
                      color: settings[activeTab]?.buttonTextColor || '#fff',
                      backgroundColor: settings[activeTab]?.buttonColor || '#f59e0b'
                    }}
                  >
                    {t === 'home' ? 'Home' : t === 'about' ? 'About' : t === 'projects' ? 'Projects' : t === 'contact' ? 'Contact' : t === 'manage-projects' ? '⚙️ Manage Projects' : t === 'file-manager' ? '📁 File Manager' : '✏️ Editor'}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                if (isAdmin) {
                  setIsAdmin(false)
                  setPasswordInput('')
                } else {
                  setShowPasswordDialog(true)
                }
              }}
              style={{ backgroundColor: settings[activeTab]?.buttonColor || '#f59e0b', color: settings[activeTab]?.buttonTextColor || '#fff' }}
              className="rounded-md px-4 py-2 text-lg font-bold shadow"
            >
              {isAdmin ? '✓ Admin Active' : '🔒 Enter Admin'}
            </button>
          </div>
        </div>
      </nav>

      {/* تب‌ها */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
          {/* Tabs are controlled via nav buttons in the top bar */}

          <TabContent tabName="home" />
          <TabContent tabName="about" />
          <TabContent tabName="projects" />
          <TabContent tabName="contact" />
          {isAdmin && <TabContent tabName="manage-projects" />}
          {isAdmin && <TabContent tabName="file-manager" />}
          {isAdmin && <TabContent tabName="editor" />}
        </Tabs>
      </div>
    </div>
  )
}
