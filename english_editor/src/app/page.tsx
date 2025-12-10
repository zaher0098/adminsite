'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Archive, Trash2, Plus, Users, Settings } from 'lucide-react';
import SimplePostEditor from '@/components/canvas-editor/SimplePostEditor';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  published: boolean;
  archived: boolean;
  canvasData?: string;
  background?: string;
  blurAmount?: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
    role: string;
  };
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('user');
  const [adminUserId, setAdminUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminUser();
    fetchPosts();
  }, [activeTab]);

  const fetchAdminUser = async () => {
    try {
      const response = await fetch('/api/admin-user');
      console.log('Admin user response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Admin user data:', data);
        setAdminUserId(data.user?.id || data.userId || '');
      } else {
        console.error('Failed to fetch admin user:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const isPublished = activeTab === 'user';
      const url = `/api/posts?published=${isPublished}&archived=false`;
      console.log('Fetching posts with:', url);
      
      const response = await fetch(url);
      console.log('Fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Posts data received:', data);
        console.log('Posts count:', data.length);
        setPosts(data);
      } else {
        console.error('Failed to fetch posts:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchPosts();
          toast({
            title: 'Success',
            description: 'Post deleted successfully',
          });
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        toast({
          title: 'خطا',
          description: 'Error deleting post',
          variant: 'destructive'
        });
      }
    }
  };

  const handleArchivePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      });
      if (response.ok) {
        fetchPosts();
        toast({
          title: 'Success',
          description: 'پست با Success آرشیو شد',
        });
      }
    } catch (error) {
      console.error('Error archiving post:', error);
      toast({
        title: 'خطا',
        description: 'Error archiving post',
        variant: 'destructive'
      });
    }
  };

  const handlePublishPost = async (postId: string, published: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published }),
      });
      if (response.ok) {
        fetchPosts();
        toast({
          title: 'Success',
          description: published ? 'Post published' : 'Post changed to draft',
        });
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'خطا',
        description: 'Error updating post',
        variant: 'destructive'
      });
    }
  };

  const handleSavePost = async (postData: any) => {
    try {
      console.log('Saving post data:', postData);
      const url = postData.id ? `/api/posts/${postData.id}` : '/api/posts';
      const method = postData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      console.log('Save response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Save result:', result);
        fetchPosts();
      } else {
        const errorText = await response.text();
        console.error('Save failed:', response.status, errorText);
        throw new Error(`Failed to save post: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  };

  const renderCanvasPreview = (post: Post) => {
    try {
      const canvasData = post.canvasData ? JSON.parse(post.canvasData) : { elements: [] };
      return (
        <div 
          className="w-full h-32 rounded-md mb-4 relative overflow-hidden"
          style={{
            backgroundColor: post.background || '#ffffff',
            backgroundImage: post.background?.startsWith('http') ? `url(${post.background})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${post.blurAmount || 0}px)`
          }}
        >
          {canvasData.elements?.slice(0, 3).map((element: any, index: number) => (
            <div
              key={index}
              className="absolute text-xs"
              style={{
                left: `${(element.x / 800) * 100}%`,
                top: `${(element.y / 400) * 100}%`,
                width: `${(element.width / 800) * 100}%`,
                height: `${(element.height / 400) * 100}%`,
                backgroundColor: element.backgroundColor,
                color: element.color,
                fontSize: `${(element.fontSize || 16) * 0.5}px`,
                borderRadius: element.type === 'circle' ? '50%' : `${element.borderRadius}px`,
                border: element.borderWidth > 0 ? `${element.borderWidth}px solid ${element.borderColor}` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                overflow: 'hidden'
              }}
            >
              {element.type === 'text' ? element.content?.substring(0, 20) : ''}
            </div>
          ))}
        </div>
      );
    } catch (error) {
      return (
        <div 
          className="w-full h-32 rounded-md mb-4 bg-gray-200"
          style={{
            backgroundColor: post.background || '#ffffff',
            filter: `blur(${post.blurAmount || 0}px)`
          }}
        />
      );
    }
  };

  console.log('Main page render:', { adminUserId, postsLength: posts.length, activeTab });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Content Management System</h1>
        <p className="text-muted-foreground">ایجاد و Manage Postsی گرافیکی با ادیتور پیشرفته</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            حالت کاربر
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Admin Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">View Published Posts</h2>
              <Button 
                variant="outline" 
                onClick={async () => {
                  // Create a test published post
                  try {
                    const testData = {
                      title: 'پست تست ' + new Date().toLocaleTimeString('fa-IR'),
                      content: 'این یک پست تست است برای بررسی نمایش در حالت کاربر',
                      published: true,
                      canvasData: JSON.stringify({
                        elements: [
                          {
                            id: 'test-1',
                            type: 'rectangle',
                            x: 50,
                            y: 50,
                            width: 100,
                            height: 100,
                            backgroundColor: '#3b82f6',
                            zIndex: 1
                          }
                        ],
                        background: '#ffffff',
                        blurAmount: 0
                      }),
                      background: '#ffffff',
                      blurAmount: 0,
                      authorId: adminUserId
                    };
                    
                    const response = await fetch('/api/posts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(testData)
                    });
                    
                    if (response.ok) {
                      fetchPosts();
                      alert('پست تست با Success ایجاد شد');
                    } else {
                      alert('خطا در Create Test Post');
                    }
                  } catch (error) {
                    console.error('Error creating test post:', error);
                    alert('خطا در Create Test Post');
                  }
                }}
              >
                Create Test Post
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">هیچ Post publishedه‌ای وجود ندارد</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    برای مشاهده پست‌ها، ابتدا از تب "Admin Mode" یک پست ایجاد کرده و آن را منتشر کنید
                  </p>
                  <p className="text-xs text-muted-foreground">
                    یا روی دکمه "Create Test Post" کلیک کنید تا یک پست نمونه ایجاد شود
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                        <Badge variant="secondary" className="mr-2">
                          {post.author.name || post.author.email}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderCanvasPreview(post)}
                      <p className="text-sm text-muted-foreground mb-4">
                        {post.content || 'بدون توضیحات'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(post.createdAt).toLocaleDateString('fa-IR')}</span>
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          <span>منتشر شده</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Manage Posts</h2>
              <SimplePostEditor
                authorId={adminUserId}
                onSave={handleSavePost}
                trigger={
                  <Button onClick={() => {
                    console.log('Create post button clicked, adminUserId:', adminUserId);
                  }}>
                    <Plus className="h-4 w-4 ml-2" />
                    Create New Post
                  </Button>
                }
              />
            </div>
            
            {loading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No posts</p>
                  <SimplePostEditor
                    authorId={adminUserId}
                    onSave={handleSavePost}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{post.title}</h3>
                            <Badge variant={post.published ? "default" : "secondary"}>
                              {post.published ? 'منتشر شده' : 'پیش‌نویس'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            توسط {post.author.name || post.author.email} • {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                          </p>
                          {post.content && (
                            <p className="text-sm line-clamp-2">{post.content}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mr-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublishPost(post.id, !post.published)}
                          >
                            {post.published ? 'پیش‌نویس' : 'انتشار'}
                          </Button>
                          <SimplePostEditor
                            post={post}
                            authorId={adminUserId}
                            onSave={handleSavePost}
                            trigger={
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleArchivePost(post.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
