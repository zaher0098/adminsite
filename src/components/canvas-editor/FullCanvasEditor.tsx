'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Square, 
  Circle, 
  Layers, 
  Lock, 
  Unlock, 
  Trash2, 
  Eye, 
  EyeOff,
  Move,
  Image as ImageIcon
} from 'lucide-react';

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

interface FullCanvasEditorProps {
  initialData?: CanvasElement[];
  background?: string;
  blurAmount?: number;
  onChange?: (elements: CanvasElement[], background: string, blurAmount: number) => void;
}

export default function FullCanvasEditor({ 
  initialData = [], 
  background = '#ffffff', 
  blurAmount = 0,
  onChange 
}: FullCanvasEditorProps) {
  const [elements, setElements] = useState<CanvasElement[]>(initialData);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasBackground, setCanvasBackground] = useState(background);
  const [canvasBlur, setCanvasBlur] = useState(blurAmount);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeType, setResizeType] = useState<'width' | 'height' | 'both' | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onChange) {
      onChange(elements, canvasBackground, canvasBlur);
    }
  }, [elements, canvasBackground, canvasBlur, onChange]);

  const addElement = (type: CanvasElement['type']) => {
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type,
      x: 50,
      y: 50,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 50 : 100,
      content: type === 'text' ? 'متن جدید' : undefined,
      backgroundColor: type === 'text' ? 'transparent' : '#3b82f6',
      color: '#000000',
      fontSize: 16,
      fontWeight: 'normal',
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#000000',
      locked: false,
      visible: true,
      zIndex: elements.length
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prevElements => 
      prevElements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    );
  };

  const deleteElement = (id: string) => {
    setElements(prevElements => prevElements.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    setElements(prevElements => {
      const elementIndex = prevElements.findIndex(el => el.id === id);
      if (elementIndex === -1) return prevElements;

      const newElements = [...prevElements];
      const element = newElements[elementIndex];
      
      if (direction === 'up' && elementIndex < newElements.length - 1) {
        const nextElement = newElements[elementIndex + 1];
        newElements[elementIndex + 1] = element;
        newElements[elementIndex] = nextElement;
      } else if (direction === 'down' && elementIndex > 0) {
        const prevElement = newElements[elementIndex - 1];
        newElements[elementIndex - 1] = element;
        newElements[elementIndex] = prevElement;
      }

      return newElements.map((el, index) => ({ ...el, zIndex: index }));
    });
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.target === e.currentTarget) {
      const element = elements.find(el => el.id === elementId);
      if (element && !element.locked) {
        setIsDragging(true);
        setDraggedElement(elementId);
        setSelectedElement(elementId);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setDragOffset({
            x: e.clientX - rect.left - element.x,
            y: e.clientY - rect.top - element.y
          });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && draggedElement) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;
        updateElement(draggedElement, { x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedElement(null);
    setIsResizing(false);
    setResizingElement(null);
  };

  const handleWidthResizeMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element && !element.locked) {
      setIsResizing(true);
      setResizingElement(elementId);
      setResizeType('width');
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width,
        height: element.height
      });
    }
  };

  const handleHeightResizeMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element && !element.locked) {
      setIsResizing(true);
      setResizingElement(elementId);
      setResizeType('height');
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width,
        height: element.height
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element && !element.locked) {
      setIsResizing(true);
      setResizingElement(elementId);
      setResizeType('both');
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width,
        height: element.height
      });
    }
  };

  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (isResizing && resizingElement) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      if (resizeType === 'width') {
        updateElement(resizingElement, {
          width: Math.max(50, resizeStart.width + deltaX)
        });
      } else if (resizeType === 'height') {
        updateElement(resizingElement, {
          height: Math.max(30, resizeStart.height + deltaY)
        });
      } else {
        updateElement(resizingElement, {
          width: Math.max(50, resizeStart.width + deltaX),
          height: Math.max(30, resizeStart.height + deltaY)
        });
      }
    }
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">ادیتور گرافیکی کامل</h3>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => addElement('text')}
          >
            <Type className="h-4 w-4 ml-2" />
            متن
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => addElement('rectangle')}
          >
            <Square className="h-4 w-4 ml-2" />
            مربع
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => addElement('circle')}
          >
            <Circle className="h-4 w-4 ml-2" />
            دایره
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => addElement('image')}
          >
            <ImageIcon className="h-4 w-4 ml-2" />
            عکس
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
        {/* Canvas */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardContent className="p-4 h-full">
              <div 
                ref={canvasRef}
                className="relative w-full h-[600px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                style={{
                  backgroundColor: canvasBackground,
                  backgroundImage: canvasBackground.startsWith('http') ? `url(${canvasBackground})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: `blur(${canvasBlur}px)`
                }}
                onMouseMove={(e) => {
                  handleMouseMove(e);
                  handleResizeMouseMove(e);
                }}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {elements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-move ${element.locked ? 'cursor-not-allowed' : ''} ${!element.visible ? 'hidden' : ''} ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      backgroundColor: element.backgroundColor,
                      color: element.color,
                      fontSize: element.fontSize,
                      fontWeight: element.fontWeight,
                      borderRadius: element.type === 'circle' ? '50%' : `${element.borderRadius}px`,
                      border: element.borderWidth > 0 ? `${element.borderWidth}px solid ${element.borderColor}` : 'none',
                      backgroundImage: element.backgroundImage ? `url(${element.backgroundImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      zIndex: element.zIndex,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      userSelect: element.locked ? 'none' : 'auto'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, element.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement(element.id);
                    }}
                  >
                    {element.type === 'text' ? (
                      <div 
                        contentEditable={!element.locked}
                        suppressContentEditableWarning
                        onBlur={(e) => updateElement(element.id, { content: e.target.textContent || '' })}
                        className="w-full h-full outline-none text-center"
                      >
                        {element.content}
                      </div>
                    ) : element.type === 'image' ? (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    ) : null}
                    
                    {/* Width Resize Handle */}
                    {selectedElement === element.id && !element.locked && (
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 cursor-e-resize z-50"
                        style={{
                          zIndex: 9999,
                          position: 'absolute',
                          bottom: 0,
                          right: 0
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWidthResizeMouseDown(e, element.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    
                    {/* Height Resize Handle */}
                    {selectedElement === element.id && !element.locked && (
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 cursor-s-resize z-50"
                        style={{
                          zIndex: 9999,
                          position: 'absolute',
                          bottom: 0,
                          right: 0
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleHeightResizeMouseDown(e, element.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="lg:col-span-1 space-y-2">
          {/* Background Settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">پس‌زمینه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label htmlFor="bg-color" className="text-xs">رنگ</Label>
                <Input
                  id="bg-color"
                  type="color"
                  value={canvasBackground.startsWith('#') ? canvasBackground : '#ffffff'}
                  onChange={(e) => setCanvasBackground(e.target.value)}
                  className="mt-1 h-6"
                />
              </div>
              <div>
                <Label htmlFor="bg-image" className="text-xs">تصویر</Label>
                <Input
                  id="bg-image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={canvasBackground.startsWith('http') ? canvasBackground : ''}
                  onChange={(e) => setCanvasBackground(e.target.value)}
                  className="mt-1 h-6 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="blur" className="text-xs">تاری: {canvasBlur}px</Label>
                <Slider
                  id="blur"
                  min={0}
                  max={20}
                  step={1}
                  value={[canvasBlur]}
                  onValueChange={(value) => setCanvasBlur(value[0])}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Element Properties */}
          {selectedEl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  ویژگی‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>قفل کردن</Label>
                  <Switch
                    checked={selectedEl.locked}
                    onCheckedChange={(checked) => updateElement(selectedEl.id, { locked: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>نمایش</Label>
                  <Switch
                    checked={selectedEl.visible}
                    onCheckedChange={(checked) => updateElement(selectedEl.id, { visible: checked })}
                  />
                </div>
                
                {selectedEl.type === 'text' && (
                  <>
                    <div>
                      <Label htmlFor="font-size">اندازه فونت</Label>
                      <Input
                        id="font-size"
                        type="number"
                        value={selectedEl.fontSize}
                        onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="text-color">رنگ متن</Label>
                      <Input
                        id="text-color"
                        type="color"
                        value={selectedEl.color}
                        onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
                
                {selectedEl.type !== 'text' && (
                  <>
                    <div>
                      <Label htmlFor="fill-color">رنگ پر کردن</Label>
                      <Input
                        id="fill-color"
                        type="color"
                        value={selectedEl.backgroundColor}
                        onChange={(e) => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="border-radius">گوشه گرد</Label>
                      <Input
                        id="border-radius"
                        type="number"
                        value={selectedEl.borderRadius}
                        onChange={(e) => updateElement(selectedEl.id, { borderRadius: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="border-width">ضخامت حاشیه</Label>
                      <Input
                        id="border-width"
                        type="number"
                        value={selectedEl.borderWidth}
                        onChange={(e) => updateElement(selectedEl.id, { borderWidth: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="border-color">رنگ حاشیه</Label>
                      <Input
                        id="border-color"
                        type="color"
                        value={selectedEl.borderColor}
                        onChange={(e) => updateElement(selectedEl.id, { borderColor: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveLayer(selectedEl.id, 'up')}
                    disabled={elements.findIndex(el => el.id === selectedEl.id) === elements.length - 1}
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveLayer(selectedEl.id, 'down')}
                    disabled={elements.findIndex(el => el.id === selectedEl.id) === 0}
                  >
                    <Move className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteElement(selectedEl.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Layers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                لایه‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {elements.slice().reverse().map((element, index) => {
                  const actualIndex = elements.length - 1 - index;
                  return (
                    <div
                      key={`${element.id}-${actualIndex}`}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                        selectedElement === element.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {actualIndex + 1}
                        </Badge>
                        <span className="text-sm">
                          {element.type === 'text' ? '📝' : element.type === 'rectangle' ? '⬜' : element.type === 'circle' ? '⭕' : '🖼️'}
                          {element.content ? ` ${element.content.substring(0, 10)}...` : ` ${element.type}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateElement(element.id, { visible: !element.visible });
                          }}
                        >
                          {element.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateElement(element.id, { locked: !element.locked });
                          }}
                        >
                          {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}