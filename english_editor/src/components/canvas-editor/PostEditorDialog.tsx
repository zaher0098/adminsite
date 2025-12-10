'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Eye, Save } from 'lucide-react';
import CanvasEditor from './CanvasEditor';
import { useToast } from '@/hooks/use-toast';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'rectangle' | 'circle';
  content?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundImage?: string;
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

interface Post {
  id?: string;
  title: string;
  content?: string;
  published: boolean;
  archived: boolean;
  canvasData?: string;
  background?: string;
  blurAmount?: number;
  authorId: string;
}

interface PostEditorDialogProps {
  post?: Post;
  authorId: string;
  onSave: (post: Partial<Post>) => void;
  trigger?: React.ReactNode;
}

export default function PostEditorDialog({ post, authorId, onSave, trigger }: PostEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    published: post?.published || false,
    canvasData: post?.canvasData || '[]',
    background: post?.background || '#ffffff',
    blurAmount: post?.blurAmount || 0
  });
  
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (post?.canvasData) {
      try {
        const parsed = JSON.parse(post.canvasData);
        setCanvasElements(parsed.elements || []);
      } catch (error) {
        console.error('Error parsing canvas data:', error);
      }
    }
  }, [post?.canvasData]);

  const handleCanvasChange = (elements: CanvasElement[], background: string, blurAmount: number) => {
    console.log('Canvas changed:', { elements, background, blurAmount });
    setCanvasElements(elements);
    setFormData(prev => ({
      ...prev,
      background,
      blurAmount
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'خطا',
        description: 'عنوان پست الزامی است',
        variant: 'destructive'
      });
      return;
    }

    if (!authorId) {
      toast({
        title: 'خطا',
        description: 'شناسه نویسنده یافت نشد',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const canvasDataString = JSON.stringify({
        elements: canvasElements,
        background: formData.background,
        blurAmount: formData.blurAmount
      });

      const postData: Partial<Post> = {
        title: formData.title,
        content: formData.content,
        published: formData.published,
        canvasData: canvasDataString,
        background: formData.background,
        blurAmount: formData.blurAmount,
        authorId
      };

      if (post?.id) {
        postData.id = post.id;
      }

      console.log('Submitting post data:', postData);
      await onSave(postData);
      setOpen(false);
      
      toast({
        title: 'موفقیت',
        description: post?.id ? 'پست با موفقیت ویرایش شد' : 'پست با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره پست',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button onClick={() => {
      console.log('Button clicked, opening dialog...');
      setOpen(true);
    }}>
      {post ? <Edit className="h-4 w-4 ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
      {post ? 'ویرایش پست' : 'ساخت پست جدید'}
    </Button>
  );

  console.log('PostEditorDialog render:', { open, post, authorId });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {post ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {post ? 'ویرایش پست' : 'ساخت پست جدید'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
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
                  <Badge variant="default" className="mr-2">
                    <Eye className="h-3 w-3 ml-1" />
                    عمومی
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Canvas Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ادیتور گرافیکی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[500px]">
                <CanvasEditor
                  initialData={canvasElements}
                  background={formData.background}
                  blurAmount={formData.blurAmount}
                  onChange={handleCanvasChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  );
}