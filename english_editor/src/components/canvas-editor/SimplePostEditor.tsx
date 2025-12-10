'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/custom-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import AdvancedCanvasEditor from './AdvancedCanvasEditor';

import { Plus, Edit, Eye, Save } from 'lucide-react';

interface SimplePostEditorProps {
  post?: any;
  authorId: string;
  onSave: (post: any) => void;
  trigger?: React.ReactNode;
}

export default function SimplePostEditor({ post, authorId, onSave, trigger }: SimplePostEditorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    published: post?.published || false
  });
  
  const [canvasElements, setCanvasElements] = useState([]);
  const [canvasBackground, setCanvasBackground] = useState(post?.background || '#ffffff');
  const [canvasBlur, setCanvasBlur] = useState(post?.blurAmount || 0);

  console.log('SimplePostEditor render:', { open, post, authorId, formData });

  useEffect(() => {
    if (post?.canvasData) {
      try {
        const parsed = JSON.parse(post.canvasData);
        setCanvasElements(parsed.elements || []);
        setCanvasBackground(parsed.background || '#ffffff');
        setCanvasBlur(parsed.blurAmount || 0);
      } catch (error) {
        console.error('Error parsing canvas data:', error);
      }
    }
  }, [post?.canvasData]);

  const handleCanvasSave = (elements, background, blurAmount) => {
    console.log('Canvas saved:', { elements, background, blurAmount });
    setCanvasElements(elements);
    setCanvasBackground(background);
    setCanvasBlur(blurAmount);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('عنوان پست الزامی است');
      return;
    }

    setLoading(true);
    
    try {
      const canvasDataString = JSON.stringify({
        elements: canvasElements,
        background: canvasBackground,
        blurAmount: canvasBlur
      });

      const postData = {
        title: formData.title,
        content: formData.content,
        published: formData.published,
        canvasData: canvasDataString,
        background: canvasBackground,
        blurAmount: canvasBlur,
        authorId
      };

      if (post?.id) {
        postData.id = post.id;
      }

      console.log('Submitting post data:', postData);
      await onSave(postData);
      setOpen(false);
      
      alert('پست با موفقیت ذخیره شد');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('خطا در ذخیره پست');
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button onClick={() => {
      console.log('Simple button clicked, opening dialog...');
      setOpen(true);
    }}>
      {post ? <Edit className="h-4 w-4 ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
      {post ? 'ویرایش پست' : 'ساخت پست جدید'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 overflow-hidden">
    <div className="w-full h-full flex flex-col">
      <DialogHeader className="flex-shrink-0 p-4 border-b">
        <DialogTitle className="flex items-center gap-2">
          {post ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {post ? 'ویرایش پست' : 'ساخت پست جدید'}
        </DialogTitle>
      </DialogHeader>
      
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اطلاعات اصلی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان پست</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="عنوان پست را وارد کنید"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="content">توضیحات</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="توضیحات پست (اختیاری)"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                />
                <Label htmlFor="published">منتشر شده</Label>
                {formData.published && (
                  <div className="flex items-center gap-1 mr-2">
                    <Eye className="h-3 w-3" />
                    <span className="text-sm">عمومی</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Full Canvas Editor */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg">ادیتور گرافیکی کامل</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="h-[80vh] min-h-[600px]">
                <AdvancedCanvasEditor
                  initialData={canvasElements}
                  background={canvasBackground}
                  blurAmount={canvasBlur}
                  onSave={handleCanvasSave}
                  onCancel={() => setOpen(false)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                ذخیره پست
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  </DialogContent>
    </Dialog>
  );
}