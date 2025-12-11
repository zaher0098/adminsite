import os

file_path = r'c:\Users\zaher\Downloads\adminsite\src\components\canvas-editor\SimplePostEditor.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import useRef and AdvancedCanvasEditorRef
if "import { useState, useEffect } from 'react';" in content:
    content = content.replace(
        "import { useState, useEffect } from 'react';",
        "import { useState, useEffect, useRef } from 'react';"
    )

if "import AdvancedCanvasEditor from './AdvancedCanvasEditor';" in content:
    content = content.replace(
        "import AdvancedCanvasEditor from './AdvancedCanvasEditor';",
        "import AdvancedCanvasEditor, { AdvancedCanvasEditorRef } from './AdvancedCanvasEditor';"
    )

# 2. Create ref
if "const [loading, setLoading] = useState(false);" in content:
    content = content.replace(
        "const [loading, setLoading] = useState(false);",
        "const [loading, setLoading] = useState(false);\n  const editorRef = useRef<AdvancedCanvasEditorRef>(null);"
    )

# 3. Update handleSave to generate and upload PDF
if "const handleSave = async () => {" in content:
    # We need to replace the body of handleSave
    # Let's find the block
    start_marker = "const handleSave = async () => {"
    end_marker = "const defaultTrigger ="
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        old_function = content[start_idx:end_idx]
        
        new_function = """const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('عنوان پست الزامی است');
      return;
    }

    setLoading(true);
    
    try {
      let pdfUrl = null;
      
      // Generate PDF if editor ref is available
      if (editorRef.current) {
        try {
          const pdfBlob = await editorRef.current.getPDFBlob();
          
          // Upload PDF
          const uploadFormData = new FormData();
          uploadFormData.append('file', pdfBlob, `post-${Date.now()}.pdf`);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            pdfUrl = uploadData.url;
            console.log('PDF uploaded successfully:', pdfUrl);
          } else {
            console.error('Failed to upload PDF');
          }
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
        }
      }

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
        pdfUrl: pdfUrl,
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

  """
        content = content.replace(old_function, new_function)

# 4. Pass ref to AdvancedCanvasEditor
if "<AdvancedCanvasEditor" in content:
    content = content.replace(
        "<AdvancedCanvasEditor",
        "<AdvancedCanvasEditor\n                  ref={editorRef}"
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated SimplePostEditor.tsx")
