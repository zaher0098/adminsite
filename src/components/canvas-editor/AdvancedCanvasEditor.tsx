'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Move3D, Square, Circle, Type, ImageIcon, Trash2, Copy, Lock, Unlock, Eye, EyeOff, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Triangle, Hexagon, Star, List, ListOrdered, Palette, Upload, Image as ImageIcon2, Save as SaveIcon, X as XIcon, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useImperativeHandle, forwardRef } from 'react';

interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'image' | 'triangle' | 'hexagon' | 'star';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: string;
  listStyle?: 'none' | 'disc' | 'decimal';
  letterSpacing?: number;
  lineHeight?: number;
  image?: string;
  locked?: boolean;
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  frameType?: 'none' | 'shadow' | 'border';
}

export interface AdvancedCanvasEditorRef {
  getPDFBlob: () => Promise<Blob>;
  getData: () => { elements: CanvasElement[], background: string, blurAmount: number };
}

interface AdvancedCanvasEditorProps {
  initialData?: CanvasElement[];
  background?: string;
  blurAmount?: number;
  onSave: (data: CanvasElement[], background?: string, blurAmount?: number) => void;
  onCancel: () => void;
  showSaveControls?: boolean;
  readOnly?: boolean;
}

const AdvancedCanvasEditor = forwardRef<AdvancedCanvasEditorRef, AdvancedCanvasEditorProps>(({
  initialData = [],
  background: initialBackground = '',
  blurAmount: initialBlurAmount = 0,
  onSave,
  onCancel,
  showSaveControls = true,
  readOnly = false
}: AdvancedCanvasEditorProps, ref) => {
  // Initialize elements with proper zIndex values
  const initializedElements = initialData.map((el, index) => ({
    ...el,
    zIndex: el.zIndex !== undefined && el.zIndex !== null ? el.zIndex : index + 1
  }));
  
  const [elements, setElements] = useState<CanvasElement[]>(initializedElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [background, setBackground] = useState(initialBackground);
  const [blurAmount, setBlurAmount] = useState(initialBlurAmount);
  const [canvasWidth, setCanvasWidth] = useState(794); // A4 width
  const [canvasHeight, setCanvasHeight] = useState(1123); // A4 height
  const [canvasBorderColor, setCanvasBorderColor] = useState('#000000');
  const [canvasBorderWidth, setCanvasBorderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const pendingDragRef = useRef<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state with props when they change
  useEffect(() => {
    const initializedElements = initialData.map((el, index) => ({
      ...el,
      zIndex: el.zIndex !== undefined && el.zIndex !== null ? el.zIndex : index + 1
    }));
    setElements(initializedElements);
  }, [initialData]);

  useEffect(() => {
    setBackground(initialBackground);
  }, [initialBackground]);

  useEffect(() => {
    setBlurAmount(initialBlurAmount);
  }, [initialBlurAmount]);

  useImperativeHandle(ref, () => ({
    getData: () => ({
      elements,
      background,
      blurAmount
    }),
    getPDFBlob: async () => {
      return new Promise<Blob>(async (resolve, reject) => {
        try {
          const hexToRgb = (hex: string): [number, number, number] => {
            hex = hex.replace('#', '');
            if (hex.length === 3) {
              hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return [r, g, b];
          };

          const pdf = new jsPDF({
            orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvasWidth, canvasHeight]
          });

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasWidth;
          tempCanvas.height = canvasHeight;
          const ctx = tempCanvas.getContext('2d');

          if (!ctx) throw new Error('Failed to get canvas context');

          // Draw background
          if (background) {
            if (background.startsWith('#') || background.startsWith('rgb')) {
              ctx.fillStyle = background;
              ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            } else if (background.startsWith('data:') || background.startsWith('http')) {
              const bgImg = new Image();
              bgImg.crossOrigin = 'anonymous';
              bgImg.src = background;
              await new Promise((resolveImg) => {
                bgImg.onload = () => {
                  ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
                  resolveImg(true);
                };
                bgImg.onerror = () => {
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                  resolveImg(false);
                };
              });
            }
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          }

          const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
          const allElements = sortedElements.filter(element => element.visible);

          for (let i = 0; i < allElements.length; i++) {
            const element = allElements[i];
            const opacity = (element.opacity || 100) / 100;

            if (element.type === 'text') {
              if (!element.text) continue;
              
              if (element.backgroundColor && element.backgroundColor !== 'transparent') {
                const [r, g, b] = hexToRgb(element.backgroundColor);
                pdf.setFillColor(r, g, b);
                pdf.setGState(new (pdf as any).GState({ opacity }));
                pdf.rect(element.x, element.y, element.width, element.height, 'F');
              }

              if (element.borderColor && element.borderWidth) {
                const [r, g, b] = hexToRgb(element.borderColor);
                pdf.setDrawColor(r, g, b);
                pdf.setLineWidth(element.borderWidth);
                pdf.setGState(new (pdf as any).GState({ opacity }));
                pdf.rect(element.x, element.y, element.width, element.height, 'S');
              }

              const fontSize = element.fontSize || 16;
              pdf.setFontSize(fontSize);
              
              const textColor = element.color || '#000000';
              const [r, g, b] = hexToRgb(textColor);
              pdf.setTextColor(r, g, b);
              pdf.setGState(new (pdf as any).GState({ opacity }));
              
              let fontStyle = 'normal';
              if (element.fontWeight === 'bold' && element.fontStyle === 'italic') {
                fontStyle = 'bolditalic';
              } else if (element.fontWeight === 'bold') {
                fontStyle = 'bold';
              } else if (element.fontStyle === 'italic') {
                fontStyle = 'italic';
              }
              pdf.setFont('helvetica', fontStyle);

              let cleanText = element.text || '';
              cleanText = cleanText
                .replace(/<\/div><div>/gi, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<div>/gi, '')
                .replace(/<\/div>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<p[^>]*>/gi, '')
                .replace(/<[^>]*>/g, '')
                .replace(/^\n+/, '')
                .replace(/\n+$/, '');
              
              const lines = cleanText.split('\n');
              const lineHeight = fontSize * 1.2;
              const wrappedLines: string[] = [];
              const maxWidth = element.width - 16;
              
              lines.forEach(line => {
                if (!line) {
                  wrappedLines.push('');
                  return;
                }
                const words = line.split(' ');
                let currentLine = '';
                words.forEach((word, index) => {
                  const testLine = currentLine ? `${currentLine} ${word}` : word;
                  const textWidth = pdf.getTextWidth(testLine);
                  if (textWidth > maxWidth && currentLine) {
                    wrappedLines.push(currentLine);
                    currentLine = word;
                  } else {
                    currentLine = testLine;
                  }
                  if (index === words.length - 1) {
                    wrappedLines.push(currentLine);
                  }
                });
              });
              
              wrappedLines.forEach((line, index) => {
                const y = element.y + fontSize + 8 + (index * lineHeight);
                let x = element.x + 8;
                if (element.textAlign === 'center') {
                  x = element.x + element.width / 2;
                  pdf.text(line, x, y, { align: 'center' });
                } else if (element.textAlign === 'right') {
                  x = element.x + element.width - 8;
                  pdf.text(line, x, y, { align: 'right' });
                } else {
                  pdf.text(line, x, y);
                }
              });
              continue;
            }

            // Non-text elements
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) continue;

            ctx.globalAlpha = opacity;

            if (element.type === 'rectangle') {
              if (element.backgroundColor) {
                ctx.fillStyle = element.backgroundColor;
                if (element.borderRadius) {
                  const radius = element.borderRadius;
                  ctx.beginPath();
                  ctx.moveTo(element.x + radius, element.y);
                  ctx.lineTo(element.x + element.width - radius, element.y);
                  ctx.quadraticCurveTo(element.x + element.width, element.y, element.x + element.width, element.y + radius);
                  ctx.lineTo(element.x + element.width, element.y + element.height - radius);
                  ctx.quadraticCurveTo(element.x + element.width, element.y + element.height, element.x + element.width - radius, element.y + element.height);
                  ctx.lineTo(element.x + radius, element.y + element.height);
                  ctx.quadraticCurveTo(element.x, element.y + element.height, element.x, element.y + element.height - radius);
                  ctx.lineTo(element.x, element.y + radius);
                  ctx.quadraticCurveTo(element.x, element.y, element.x + radius, element.y);
                  ctx.closePath();
                  ctx.fill();
                } else {
                  ctx.fillRect(element.x, element.y, element.width, element.height);
                }
              }
              if (element.borderColor && element.borderWidth) {
                ctx.strokeStyle = element.borderColor;
                ctx.lineWidth = element.borderWidth;
                if (element.borderRadius) {
                  const radius = element.borderRadius;
                  ctx.beginPath();
                  ctx.moveTo(element.x + radius, element.y);
                  ctx.lineTo(element.x + element.width - radius, element.y);
                  ctx.quadraticCurveTo(element.x + element.width, element.y, element.x + element.width, element.y + radius);
                  ctx.lineTo(element.x + element.width, element.y + element.height - radius);
                  ctx.quadraticCurveTo(element.x + element.width, element.y + element.height, element.x + element.width - radius, element.y + element.height);
                  ctx.lineTo(element.x + radius, element.y + element.height);
                  ctx.quadraticCurveTo(element.x, element.y + element.height, element.x, element.y + element.height - radius);
                  ctx.lineTo(element.x, element.y + radius);
                  ctx.quadraticCurveTo(element.x, element.y, element.x + radius, element.y);
                  ctx.closePath();
                  ctx.stroke();
                } else {
                  ctx.strokeRect(element.x, element.y, element.width, element.height);
                }
              }
            }
            else if (element.type === 'circle') {
              ctx.beginPath();
              ctx.ellipse(element.x + element.width / 2, element.y + element.height / 2, element.width / 2, element.height / 2, 0, 0, 2 * Math.PI);
              if (element.backgroundColor) { ctx.fillStyle = element.backgroundColor; ctx.fill(); }
              if (element.borderColor && element.borderWidth) { ctx.strokeStyle = element.borderColor; ctx.lineWidth = element.borderWidth; ctx.stroke(); }
            }
            else if (element.type === 'triangle') {
              ctx.beginPath();
              ctx.moveTo(element.x + element.width / 2, element.y);
              ctx.lineTo(element.x + element.width, element.y + element.height);
              ctx.lineTo(element.x, element.y + element.height);
              ctx.closePath();
              if (element.backgroundColor) { ctx.fillStyle = element.backgroundColor; ctx.fill(); }
              if (element.borderColor && element.borderWidth) { ctx.strokeStyle = element.borderColor; ctx.lineWidth = element.borderWidth; ctx.stroke(); }
            }
            else if (element.type === 'image' && element.image) {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = element.image;
              await new Promise((resolveImg) => {
                img.onload = () => {
                  ctx.drawImage(img, element.x, element.y, element.width, element.height);
                  if (element.borderColor && element.borderWidth) {
                    ctx.strokeStyle = element.borderColor;
                    ctx.lineWidth = element.borderWidth;
                    ctx.strokeRect(element.x, element.y, element.width, element.height);
                  }
                  resolveImg(true);
                };
                img.onerror = () => resolveImg(false);
              });
            }

            ctx.globalAlpha = 1;
            const elementCanvas = tempCanvas.toDataURL('image/png');
            pdf.addImage(elementCanvas, 'PNG', 0, 0, canvasWidth, canvasHeight);
          }

          const blob = pdf.output('blob');
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      });
    }
  }));


  // Helper function to generate a unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Debug useEffect to monitor elements state
  useEffect(() => {
    console.log('Elements updated:', elements.map(el => ({ 
      id: el.id, 
      type: el.type, 
      zIndex: el.zIndex,
      selected: el.id === selectedElement 
    })));
  }, [elements, selectedElement]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key
      if (e.key === 'Delete' && selectedElement) {
        deleteSelectedElement();
      }
      
      // Ctrl+C for copy
      if (e.ctrlKey && e.key === 'c' && selectedElement) {
        e.preventDefault();
        const element = elements.find(el => el.id === selectedElement);
        if (element) {
          duplicateSelectedElement();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, elements]);

  const addElement = (type: CanvasElement['type']) => {
    const newElement: CanvasElement = {
      id: generateId(),
      type,
      x: 50,
      y: 50,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 100 : 100,
      text: type === 'text' ? 'New Text' : undefined,
      color: '#000000',
      backgroundColor: type === 'text' ? 'transparent' : '#3b82f6',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      textDecoration: 'none',
      listStyle: 'none',
      letterSpacing: 0,
      lineHeight: 1.5,
      image: undefined,
      locked: false,
      visible: true,
      opacity: 100,
      zIndex: elements.length > 0 ? Math.max(...elements.map(el => el.zIndex || 0)) + 1 : 1,
      borderWidth: 0,
      borderColor: '#000000',
      borderRadius: 0,
      frameType: 'none'
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    console.log('updateElement called:', id, updates);
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  // Helpers to handle selection-aware inline formatting
  const isSelectionInsideElement = (elId: string) => {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      let node: Node | null = sel.anchorNode;
      while (node) {
        if (node instanceof Element) {
          const attr = node.getAttribute('data-element-id');
          if (attr === elId) return true;
        }
        node = node.parentNode;
      }
    } catch (err) {
      return false;
    }
    return false;
  };

  const restoreSavedSelection = () => {
    try {
      const sel = window.getSelection();
      if (!sel) return false;
      sel.removeAllRanges();
      if (savedRangeRef.current) {
        sel.addRange(savedRangeRef.current);
        return true;
      }
    } catch (err) {
      // ignore
    }
    return false;
  };

  const applyFormat = (command: string, value?: string) => {
    if (!selectedElement) return;
    const selInside = isSelectionInsideElement(selectedElement);
    if (selInside && savedRangeRef.current) {
      // Focus the editable element first so that restoring the range works
      const elDiv = document.querySelector(`[data-element-id="${selectedElement}"]`) as HTMLElement | null;
      try { if (elDiv) elDiv.focus(); } catch (err) {}

      // Use a short timeout to allow focus to take effect before restoring selection
      setTimeout(() => {
        const restored = restoreSavedSelection();
        try {
          document.execCommand(command, false, value as any);
          // Persist the innerHTML back to element state
          if (elDiv) updateElement(selectedElement, { text: elDiv.innerHTML });
          // After applying formatting, re-save the current selection so subsequent
          // toolbar actions can operate on the same selection without reselecting.
          try {
            const selAfter = window.getSelection();
            if (selAfter && selAfter.rangeCount > 0) {
              savedRangeRef.current = selAfter.getRangeAt(0).cloneRange();
            }
          } catch (err) {
            // ignore
          }
        } catch (err) {
          // fallback: do nothing
        }
      }, 0);
    } else {
      // No selection inside element: apply at element level
      const el = elements.find(e => e.id === selectedElement);
      if (!el) return;
      if (command === 'bold') {
        updateElement(selectedElement, { fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' });
      } else if (command === 'italic') {
        updateElement(selectedElement, { fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' });
      } else if (command === 'underline') {
        updateElement(selectedElement, { textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' });
      } else if (command === 'foreColor' && value) {
        updateElement(selectedElement, { color: value });
      }
    }
  };

  // Keep savedRangeRef updated when the selection changes, so clicks on toolbar
  // controls (which blur the editable) can still restore the last selection.
  useEffect(() => {
    const onSelectionChange = () => {
      try {
        if (!selectedElement) return;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0).cloneRange();
          // verify selection is inside the selected element before saving
          let node: Node | null = sel.anchorNode;
          let inside = false;
          while (node) {
            if (node instanceof Element) {
              const attr = node.getAttribute('data-element-id');
              if (attr === selectedElement) { inside = true; break; }
            }
            node = node.parentNode;
          }
          if (inside) savedRangeRef.current = range;
        }
      } catch (err) {
        // ignore
      }
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [selectedElement]);

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(elements.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  const duplicateSelectedElement = () => {
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        const newElement = {
          ...element,
          id: generateId(),
          x: element.x + 20,
          y: element.y + 20,
          zIndex: elements.length > 0 ? Math.max(...elements.map(el => el.zIndex || 0)) + 1 : 1
        };
        setElements([...elements, newElement]);
        setSelectedElement(newElement.id);
      }
    }
  };

  const selectElement = (id: string) => {
    setSelectedElement(id);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas itself, not on elements
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, forceStart: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();

    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    // If forceStart is true, begin dragging immediately (used by drag-handle).
    if (forceStart) {
      pendingDragRef.current = false;
      setIsDragging(true);
      setDraggedElement(elementId);
      setDragStart({ x: e.clientX, y: e.clientY });
      setElementStart({
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height
      });
      return;
    }

    // Otherwise start a pending drag; only mark as actual dragging after movement threshold
    pendingDragRef.current = true;
    setDraggedElement(elementId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    });
  };

  const startResize = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    
    setIsResizing(true);
    setDraggedElement(elementId);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ 
      x: element.x, 
      y: element.y, 
      width: element.width, 
      height: element.height 
    });
  };

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedElement) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        updateElement(draggedElement, {
          x: elementStart.x + deltaX,
          y: elementStart.y + deltaY
        });
      } else if (pendingDragRef.current && draggedElement) {
        // If a pending drag exists, only start dragging after movement exceeds threshold
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        const dist = Math.hypot(deltaX, deltaY);
        if (dist > 5) {
          // start dragging
          pendingDragRef.current = false;
          setIsDragging(true);
          updateElement(draggedElement, {
            x: elementStart.x + deltaX,
            y: elementStart.y + deltaY
          });
        }
      }
      
      if (isResizing && draggedElement) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        let newWidth = elementStart.width;
        let newHeight = elementStart.height;
        
        if (resizeHandle?.includes('e')) {
          newWidth = Math.max(50, elementStart.width + deltaX);
        }
        if (resizeHandle?.includes('w')) {
          newWidth = Math.max(50, elementStart.width - deltaX);
        }
        if (resizeHandle?.includes('s')) {
          newHeight = Math.max(50, elementStart.height + deltaY);
        }
        if (resizeHandle?.includes('n')) {
          newHeight = Math.max(50, elementStart.height - deltaY);
        }
        
        updateElement(draggedElement, {
          width: newWidth,
          height: newHeight
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      pendingDragRef.current = false;
      setDraggedElement(null);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, draggedElement, dragStart, elementStart, resizeHandle]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newElement: CanvasElement = {
          id: generateId(),
          type: 'image',
          x: 50,
          y: 50,
          width: 200,
          height: 200,
          image: event.target?.result as string,
          locked: false,
          visible: true,
          opacity: 100,
          zIndex: elements.length > 0 ? Math.max(...elements.map(el => el.zIndex || 0)) + 1 : 1,
          borderWidth: 0,
          borderColor: '#000000',
          borderRadius: 0,
          frameType: 'none'
        };
        setElements([...elements, newElement]);
        setSelectedElement(newElement.id);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle background upload
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackground(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Export to PDF with selectable text
  const handleExportToPDF = async () => {
    try {
      // Create PDF
      const pdf = new jsPDF({
        orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasWidth, canvasHeight]
      });

      // Create a temporary canvas for rendering shapes and images
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;
      const ctx = tempCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw background
      if (background) {
        if (background.startsWith('#') || background.startsWith('rgb')) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } else if (background.startsWith('data:') || background.startsWith('http')) {
          // Load background image
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.src = background;
          await new Promise((resolve) => {
            bgImg.onload = () => {
              try {
                ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
                console.log('Background image loaded successfully');
              } catch (err) {
                console.error('Error drawing background:', err);
              }
              resolve(true);
            };
            bgImg.onerror = (err) => {
              console.error('Background image load error:', err);
              // Fallback to white background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvasWidth, canvasHeight);
              resolve(false);
            };
          });
        }
      } else {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Sort elements by zIndex
      const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      console.log('Rendering elements in order:', sortedElements.map(e => ({ id: e.id, type: e.type, zIndex: e.zIndex })));

      const allElements = sortedElements.filter(element => element.visible);

      // Process elements in zIndex order, adding each to PDF
      // For shapes/images: draw on canvas then add canvas snapshot
      // For text: add as PDF text directly
      
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const opacity = (element.opacity || 100) / 100;

        console.log('Processing element:', element.type, element.id, 'zIndex:', element.zIndex);

        if (element.type === 'text') {
          // Add text directly to PDF (selectable)
          if (!element.text) continue;
          
          // Draw background if exists
          if (element.backgroundColor && element.backgroundColor !== 'transparent') {
            const [r, g, b] = hexToRgb(element.backgroundColor);
            pdf.setFillColor(r, g, b);
            pdf.setGState(new (pdf as any).GState({ opacity }));
            pdf.rect(element.x, element.y, element.width, element.height, 'F');
          }

          // Draw border if exists
          if (element.borderColor && element.borderWidth) {
            const [r, g, b] = hexToRgb(element.borderColor);
            pdf.setDrawColor(r, g, b);
            pdf.setLineWidth(element.borderWidth);
            pdf.setGState(new (pdf as any).GState({ opacity }));
            pdf.rect(element.x, element.y, element.width, element.height, 'S');
          }

          // Set text properties
          const fontSize = element.fontSize || 16;
          pdf.setFontSize(fontSize);
          
          const textColor = element.color || '#000000';
          const [r, g, b] = hexToRgb(textColor);
          pdf.setTextColor(r, g, b);
          pdf.setGState(new (pdf as any).GState({ opacity }));
          
          let fontStyle = 'normal';
          if (element.fontWeight === 'bold' && element.fontStyle === 'italic') {
            fontStyle = 'bolditalic';
          } else if (element.fontWeight === 'bold') {
            fontStyle = 'bold';
          } else if (element.fontStyle === 'italic') {
            fontStyle = 'italic';
          }
          pdf.setFont('helvetica', fontStyle);

          // Handle both HTML content from contentEditable
          // Different browsers use different formats:
          // - Chrome/Safari: <div>line1</div><div>line2</div>
          // - Firefox: line1<br>line2
          
          let cleanText = element.text || '';
          
          // Convert HTML to plain text with proper line breaks
          cleanText = cleanText
            .replace(/<\/div><div>/gi, '\n')         // </div><div> → newline (Chrome/Safari multi-line)
            .replace(/<br\s*\/?>/gi, '\n')           // <br> or <br/> → newline (Firefox)
            .replace(/<div>/gi, '')                   // Remove opening <div>
            .replace(/<\/div>/gi, '\n')               // </div> → newline
            .replace(/<\/p>/gi, '\n')                 // </p> → newline
            .replace(/<p[^>]*>/gi, '')                // Remove <p> tags with attributes
            .replace(/<[^>]*>/g, '')                  // Remove all other HTML tags
            .replace(/^\n+/, '')                      // Remove leading newlines
            .replace(/\n+$/, '');                     // Remove trailing newlines
          
          const lines = cleanText.split('\n');
          const lineHeight = fontSize * 1.2;
          
          // Process each line and wrap text if it exceeds the box width
          const wrappedLines: string[] = [];
          const maxWidth = element.width - 16; // Account for padding (8px on each side)
          
          lines.forEach(line => {
            if (!line) {
              wrappedLines.push(''); // Keep empty lines
              return;
            }
            
            // Split long lines into multiple lines that fit within the box
            const words = line.split(' ');
            let currentLine = '';
            
            words.forEach((word, index) => {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const textWidth = pdf.getTextWidth(testLine);
              
              if (textWidth > maxWidth && currentLine) {
                // Current line is full, push it and start a new line
                wrappedLines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
              
              // Push the last line
              if (index === words.length - 1) {
                wrappedLines.push(currentLine);
              }
            });
          });
          
          // Draw wrapped text lines
          wrappedLines.forEach((line, index) => {
            const y = element.y + fontSize + 8 + (index * lineHeight);
            let x = element.x + 8;
            
            if (element.textAlign === 'center') {
              x = element.x + element.width / 2;
              pdf.text(line, x, y, { align: 'center' });
            } else if (element.textAlign === 'right') {
              x = element.x + element.width - 8;
              pdf.text(line, x, y, { align: 'right' });
            } else {
              pdf.text(line, x, y);
            }
          });
          
          continue;
        }

        // For non-text elements, draw on a temp canvas and add as image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) continue;

        ctx.globalAlpha = opacity;

        if (element.type === 'rectangle') {
          // Draw background
          if (element.backgroundColor) {
            ctx.fillStyle = element.backgroundColor;
            if (element.borderRadius) {
              // Draw rounded rectangle
              const radius = element.borderRadius;
              ctx.beginPath();
              ctx.moveTo(element.x + radius, element.y);
              ctx.lineTo(element.x + element.width - radius, element.y);
              ctx.quadraticCurveTo(element.x + element.width, element.y, element.x + element.width, element.y + radius);
              ctx.lineTo(element.x + element.width, element.y + element.height - radius);
              ctx.quadraticCurveTo(element.x + element.width, element.y + element.height, element.x + element.width - radius, element.y + element.height);
              ctx.lineTo(element.x + radius, element.y + element.height);
              ctx.quadraticCurveTo(element.x, element.y + element.height, element.x, element.y + element.height - radius);
              ctx.lineTo(element.x, element.y + radius);
              ctx.quadraticCurveTo(element.x, element.y, element.x + radius, element.y);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.fillRect(element.x, element.y, element.width, element.height);
            }
          }
          // Draw border
          if (element.borderColor && element.borderWidth) {
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = element.borderWidth;
            if (element.borderRadius) {
              const radius = element.borderRadius;
              ctx.beginPath();
              ctx.moveTo(element.x + radius, element.y);
              ctx.lineTo(element.x + element.width - radius, element.y);
              ctx.quadraticCurveTo(element.x + element.width, element.y, element.x + element.width, element.y + radius);
              ctx.lineTo(element.x + element.width, element.y + element.height - radius);
              ctx.quadraticCurveTo(element.x + element.width, element.y + element.height, element.x + element.width - radius, element.y + element.height);
              ctx.lineTo(element.x + radius, element.y + element.height);
              ctx.quadraticCurveTo(element.x, element.y + element.height, element.x, element.y + element.height - radius);
              ctx.lineTo(element.x, element.y + radius);
              ctx.quadraticCurveTo(element.x, element.y, element.x + radius, element.y);
              ctx.closePath();
              ctx.stroke();
            } else {
              ctx.strokeRect(element.x, element.y, element.width, element.height);
            }
          }
        }

        else if (element.type === 'circle') {
          ctx.beginPath();
          ctx.ellipse(
            element.x + element.width / 2,
            element.y + element.height / 2,
            element.width / 2,
            element.height / 2,
            0, 0, 2 * Math.PI
          );
          if (element.backgroundColor) {
            ctx.fillStyle = element.backgroundColor;
            ctx.fill();
          }
          if (element.borderColor && element.borderWidth) {
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = element.borderWidth;
            ctx.stroke();
          }
        }

        else if (element.type === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(element.x + element.width / 2, element.y);
          ctx.lineTo(element.x + element.width, element.y + element.height);
          ctx.lineTo(element.x, element.y + element.height);
          ctx.closePath();
          if (element.backgroundColor) {
            ctx.fillStyle = element.backgroundColor;
            ctx.fill();
          }
          if (element.borderColor && element.borderWidth) {
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = element.borderWidth;
            ctx.stroke();
          }
        }

        else if (element.type === 'hexagon') {
          const points = [
            [element.x + element.width * 0.5, element.y + element.height * 0.05],
            [element.x + element.width * 0.95, element.y + element.height * 0.25],
            [element.x + element.width * 0.95, element.y + element.height * 0.75],
            [element.x + element.width * 0.5, element.y + element.height * 0.95],
            [element.x + element.width * 0.05, element.y + element.height * 0.75],
            [element.x + element.width * 0.05, element.y + element.height * 0.25]
          ];
          ctx.beginPath();
          ctx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
          }
          ctx.closePath();
          if (element.backgroundColor) {
            ctx.fillStyle = element.backgroundColor;
            ctx.fill();
          }
          if (element.borderColor && element.borderWidth) {
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = element.borderWidth;
            ctx.stroke();
          }
        }

        else if (element.type === 'star') {
          const points = [
            [element.x + element.width * 0.5, element.y + element.height * 0.1],
            [element.x + element.width * 0.61, element.y + element.height * 0.35],
            [element.x + element.width * 0.88, element.y + element.height * 0.35],
            [element.x + element.width * 0.67, element.y + element.height * 0.52],
            [element.x + element.width * 0.78, element.y + element.height * 0.78],
            [element.x + element.width * 0.5, element.y + element.height * 0.6],
            [element.x + element.width * 0.22, element.y + element.height * 0.78],
            [element.x + element.width * 0.33, element.y + element.height * 0.52],
            [element.x + element.width * 0.12, element.y + element.height * 0.35],
            [element.x + element.width * 0.39, element.y + element.height * 0.35]
          ];
          ctx.beginPath();
          ctx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
          }
          ctx.closePath();
          if (element.backgroundColor) {
            ctx.fillStyle = element.backgroundColor;
            ctx.fill();
          }
          if (element.borderColor && element.borderWidth) {
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = element.borderWidth;
            ctx.stroke();
          }
        }

        else if (element.type === 'image' && element.image) {
          const img = new Image();
          // Allow cross-origin images
          img.crossOrigin = 'anonymous';
          img.src = element.image;
          
          await new Promise((resolve) => {
            img.onload = () => {
              try {
                ctx.drawImage(img, element.x, element.y, element.width, element.height);
                
                // Draw border if exists
                if (element.borderColor && element.borderWidth) {
                  ctx.strokeStyle = element.borderColor;
                  ctx.lineWidth = element.borderWidth;
                  ctx.strokeRect(element.x, element.y, element.width, element.height);
                }
                console.log('Image drawn successfully:', element.id);
              } catch (err) {
                console.error('Error drawing image:', err);
              }
              resolve(true);
            };
            img.onerror = (err) => {
              console.error('Image load error:', err);
              // Draw a placeholder rectangle if image fails
              ctx.fillStyle = '#cccccc';
              ctx.fillRect(element.x, element.y, element.width, element.height);
              ctx.strokeStyle = '#999999';
              ctx.lineWidth = 2;
              ctx.strokeRect(element.x, element.y, element.width, element.height);
              resolve(false);
            };
          });
        }

        // Add this element's canvas as a layer to PDF
        ctx.globalAlpha = 1;
        const elementCanvas = tempCanvas.toDataURL('image/png');
        pdf.addImage(elementCanvas, 'PNG', 0, 0, canvasWidth, canvasHeight);
        console.log('Added to PDF:', element.type, element.id);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `canvas-export-${timestamp}.pdf`;

      // Download PDF
      pdf.save(filename);

      alert('PDF با موفقیت ذخیره شد!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('خطا در ذخیره PDF: ' + (error as Error).message);
    }
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle short hex format
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return [r, g, b];
  };

  const moveElementUp = () => {
    console.log('=== moveElementUp called ===');
    console.log('selectedElement:', selectedElement);
    console.log('elements count:', elements.length);
    
    if (!selectedElement) {
      console.log('No element selected');
      return;
    }
    
    // Get current element
    const currentElement = elements.find(el => el.id === selectedElement);
    if (!currentElement) {
      console.log('Selected element not found');
      return;
    }
    
    console.log('Current element:', { id: currentElement.id, type: currentElement.type, zIndex: currentElement.zIndex });
    
    // Get all elements sorted by zIndex
    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const currentIndex = sortedElements.findIndex(el => el.id === selectedElement);
    
    console.log('Sorted elements:', sortedElements.map(el => ({ id: el.id, type: el.type, zIndex: el.zIndex })));
    console.log('Current index in sorted array:', currentIndex);
    
    if (currentIndex < sortedElements.length - 1) {
      // Swap with the element above
      const elementAbove = sortedElements[currentIndex + 1];
      const currentZ = currentElement.zIndex || 0;
      const aboveZ = elementAbove.zIndex || 0;
      
      console.log('Swapping z-index:', { currentId: currentElement.id, currentZ, aboveId: elementAbove.id, aboveZ });
      
      // Create new elements array with swapped z-indexes
      const newElements = elements.map(el => {
        if (el.id === selectedElement) {
          return { ...el, zIndex: aboveZ };
        } else if (el.id === elementAbove.id) {
          return { ...el, zIndex: currentZ };
        }
        return el;
      });
      
      console.log('New elements after swap:', newElements.map(el => ({ id: el.id, type: el.type, zIndex: el.zIndex })));
      setElements(newElements);
    } else {
      console.log('Element is already at the top');
    }
  };

  const moveElementDown = () => {
    console.log('=== moveElementDown called ===');
    console.log('selectedElement:', selectedElement);
    console.log('elements count:', elements.length);
    
    if (!selectedElement) {
      console.log('No element selected');
      return;
    }
    
    // Get current element
    const currentElement = elements.find(el => el.id === selectedElement);
    if (!currentElement) {
      console.log('Selected element not found');
      return;
    }
    
    console.log('Current element:', { id: currentElement.id, type: currentElement.type, zIndex: currentElement.zIndex });
    
    // Get all elements sorted by zIndex
    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const currentIndex = sortedElements.findIndex(el => el.id === selectedElement);
    
    console.log('Sorted elements:', sortedElements.map(el => ({ id: el.id, type: el.type, zIndex: el.zIndex })));
    console.log('Current index in sorted array:', currentIndex);
    
    if (currentIndex > 0) {
      // Swap with the element below
      const elementBelow = sortedElements[currentIndex - 1];
      const currentZ = currentElement.zIndex || 0;
      const belowZ = elementBelow.zIndex || 0;
      
      console.log('Swapping z-index:', { currentId: currentElement.id, currentZ, belowId: elementBelow.id, belowZ });
      
      // Create new elements array with swapped z-indexes
      const newElements = elements.map(el => {
        if (el.id === selectedElement) {
          return { ...el, zIndex: belowZ };
        } else if (el.id === elementBelow.id) {
          return { ...el, zIndex: currentZ };
        }
        return el;
      });
      
      console.log('New elements after swap:', newElements.map(el => ({ id: el.id, type: el.type, zIndex: el.zIndex })));
      setElements(newElements);
    } else {
      console.log('Element is already at the bottom');
    }
  };

  const toggleLockElement = () => {
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        updateElement(selectedElement, { locked: !element.locked });
      }
    }
  };

  const toggleVisibilityElement = () => {
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        updateElement(selectedElement, { visible: !element.visible });
      }
    }
  };

  const toggleListStyle = (style: 'disc' | 'decimal') => {
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element && element.type === 'text') {
        updateElement(selectedElement, { 
          listStyle: element.listStyle === style ? 'none' : style 
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar Container */}
      <div className="w-full z-40 bg-white border-b border-gray-200 shadow-sm flex-none" style={{ display: readOnly ? 'none' : 'block' }}>
        {/* Toolbar */}
        <div>
          <div className="px-4 py-3">
            {/* First Row - Shape Tools */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Shapes:</span>
                <Button
                  size="default"
                  variant="outline"
                onClick={() => addElement('text')}
                className="h-10 w-10 p-0"
                title="Add Text"
              >
                <Type className="w-5 h-5" />
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => addElement('rectangle')}
                className="h-10 w-10 p-0"
                title="Add Rectangle"
              >
                <Square className="w-5 h-5" />
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => addElement('circle')}
                className="h-10 w-10 p-0"
                title="Add Circle"
              >
                <Circle className="w-5 h-5" />
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => addElement('triangle')}
                className="h-10 w-10 p-0"
                title="Add Triangle"
              >
                <Triangle className="w-5 h-5" />
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => addElement('hexagon')}
                className="h-10 w-10 p-0"
                title="Add Hexagon"
              >
                <Hexagon className="w-5 h-5" />
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => addElement('star')}
                className="h-10 w-10 p-0"
                title="Add Star"
              >
                <Star className="w-5 h-5" />
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                className="h-10 w-10 p-0"
                title="Add Image"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Second Row - Text Formatting (when text is selected) */}
          {selectedElement && elements.find(el => el.id === selectedElement)?.type === 'text' && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Text:</span>
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.listStyle === 'disc' ? "default" : "outline"}
                  onClick={() => toggleListStyle('disc')}
                  className="h-10 w-10 p-0"
                  title="Bullet List"
                >
                  <List className="w-5 h-5" />
                </Button>
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.listStyle === 'decimal' ? "default" : "outline"}
                  onClick={() => toggleListStyle('decimal')}
                  className="h-10 w-10 p-0"
                  title="Numbered List"
                >
                  <ListOrdered className="w-5 h-5" />
                </Button>
                <div className="w-px h-8 bg-gray-300 mx-2" />
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.fontWeight === 'bold' ? "default" : "outline"}
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                  className="h-10 w-10 p-0"
                  title="Bold"
                >
                  <Bold className="w-5 h-5" />
                </Button>
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.fontStyle === 'italic' ? "default" : "outline"}
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                  className="h-10 w-10 p-0"
                  title="Italic"
                >
                  <Italic className="w-5 h-5" />
                </Button>
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.textDecoration === 'underline' ? "default" : "outline"}
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
                  className="h-10 w-10 p-0"
                  title="Underline"
                >
                  <Underline className="w-5 h-5" />
                </Button>
                <div className="w-px h-8 bg-gray-300 mx-2" />
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.textAlign === 'left' ? "default" : "outline"}
                  onClick={() => updateElement(selectedElement, { textAlign: 'left' })}
                  className="h-10 w-10 p-0"
                  title="Align Left"
                >
                  <AlignLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.textAlign === 'center' ? "default" : "outline"}
                  onClick={() => updateElement(selectedElement, { textAlign: 'center' })}
                  className="h-10 w-10 p-0"
                  title="Align Center"
                >
                  <AlignCenter className="w-5 h-5" />
                </Button>
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.textAlign === 'right' ? "default" : "outline"}
                  onClick={() => updateElement(selectedElement, { textAlign: 'right' })}
                  className="h-10 w-10 p-0"
                  title="Align Right"
                >
                  <AlignRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Third Row - Element Properties (when element is selected) */}
          {selectedElement && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Properties:</span>
                
                {/* Layer Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    size="default"
                    variant="outline"
                    onClick={() => {
                      console.log('Current elements:', elements.map(el => ({ 
                        id: el.id, 
                        type: el.type, 
                        zIndex: el.zIndex,
                        selected: el.id === selectedElement 
                      })));
                    }}
                    className="h-8 px-2 text-xs"
                    title="Debug Layer Info"
                  >
                    Debug
                  </Button>
                  <Button
                    size="default"
                    variant="outline"
                    onClick={moveElementUp}
                    className="h-8 w-8 p-0"
                    title="Move Layer Up"
                  >
                    <Move3D className="w-4 h-4" />
                  </Button>
                  <Button
                    size="default"
                    variant="outline"
                    onClick={moveElementDown}
                    className="h-8 w-8 p-0"
                    title="Move Layer Down"
                  >
                    <Move3D className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} />
                  </Button>
                </div>
                
                {/* Lock/Unlock Button */}
                <Button
                  size="default"
                  variant={elements.find(el => el.id === selectedElement)?.locked ? "default" : "outline"}
                  onClick={toggleLockElement}
                  className="h-8 w-8 p-0"
                  title={elements.find(el => el.id === selectedElement)?.locked ? "Unlock Element" : "Lock Element"}
                >
                  {elements.find(el => el.id === selectedElement)?.locked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </Button>
                
                {/* Background Color */}
                <div className="flex items-center gap-1">
                  <label className="text-xs font-medium">BG:</label>
                  <Input
                    type="color"
                    value={elements.find(el => el.id === selectedElement)?.backgroundColor || 
                          (elements.find(el => el.id === selectedElement)?.type === 'text' ? 'transparent' : '#3b82f6')}
                    onChange={(e) => updateElement(selectedElement, { backgroundColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0"
                  />
                </div>
                
                {/* Border Color */}
                <div className="flex items-center gap-1">
                  <label className="text-xs font-medium">Border:</label>
                  <Input
                    type="color"
                    value={elements.find(el => el.id === selectedElement)?.borderColor || '#000000'}
                    onChange={(e) => updateElement(selectedElement, { borderColor: e.target.value })}
                    className="w-8 h-8 p-0 border-0"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={elements.find(el => el.id === selectedElement)?.borderWidth || 0}
                    onChange={(e) => updateElement(selectedElement, { borderWidth: Number(e.target.value) })}
                    className="w-12 h-8 text-xs"
                    placeholder="0"
                  />
                </div>
                
                {/* Text Color (only for text elements) */}
                {elements.find(el => el.id === selectedElement)?.type === 'text' && (
                  <>
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-medium">Text:</label>
                      <button
                        type="button"
                        className="w-8 h-8 p-0 border-0 rounded-md"
                        title="Text Color"
                        onMouseDown={(e) => {
                          // save selection before toolbar click blurs the editable
                          try {
                            const sel = window.getSelection();
                            if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                          } catch (err) {}
                          // prevent default focus shift
                          e.preventDefault();
                        }}
                        onClick={() => {
                          // open the hidden native color input
                          colorInputRef.current?.click();
                        }}
                        style={{ background: elements.find(el => el.id === selectedElement)?.color || '#000000' }}
                      />
                      {/* Hidden native color input to show color picker without losing saved selection */}
                      <input
                        type="color"
                        ref={colorInputRef}
                        onChange={(e) => {
                          applyFormat('foreColor', e.target.value);
                          // reset value so same color can be picked again if needed
                          e.currentTarget.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                    </div>
                    
                    {/* Font Family */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-medium">Font:</label>
                      <select
                        value={elements.find(el => el.id === selectedElement)?.fontFamily || 'Arial, sans-serif'}
                        onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                        className="h-8 text-xs border rounded px-2"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Times New Roman, serif">Times</option>
                        <option value="Courier New, monospace">Courier</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="Comic Sans MS, cursive">Comic Sans</option>
                      </select>
                    </div>
                  </>
                )}
                
                {/* Opacity */}
                <div className="flex items-center gap-1">
                  <label className="text-xs font-medium">Opacity:</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={elements.find(el => el.id === selectedElement)?.opacity || 100}
                    onChange={(e) => updateElement(selectedElement, { opacity: Number(e.target.value) })}
                    className="w-12 h-8 text-xs"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Fourth Row - Canvas & Background Controls */}
          <div className="flex items-center gap-4">
            {/* Canvas Size Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Canvas:</span>
              <label className="text-sm font-medium">Size:</label>
              <Input
                type="number"
                value={canvasWidth}
                onChange={(e) => setCanvasWidth(Number(e.target.value))}
                className="w-20 h-8 text-sm"
                placeholder="W"
              />
              <span className="text-sm">×</span>
              <Input
                type="number"
                value={canvasHeight}
                onChange={(e) => setCanvasHeight(Number(e.target.value))}
                className="w-20 h-8 text-sm"
                placeholder="H"
              />
              <Button
                size="default"
                variant="outline"
                onClick={() => {
                  setCanvasWidth(794); // A4 width in pixels at 96 DPI
                  setCanvasHeight(1123); // A4 height in pixels at 96 DPI
                }}
                className="h-8 px-3 text-sm"
                title="Set to A4 size"
              >
                A4
              </Button>
            </div>
            
            <div className="w-px h-8 bg-gray-300" />
            
            {/* Background Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Background:</span>
              <label className="text-sm font-medium">Image:</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="text-sm h-8 w-24"
              />
              {background && (
                <>
                  <label className="text-sm font-medium">Blur:</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={blurAmount}
                    onChange={(e) => setBlurAmount(Number(e.target.value))}
                    className="w-16 h-8 text-sm"
                    placeholder="0"
                  />
                  <Button
                    size="default"
                    variant="outline"
                    onClick={() => setBackground('')}
                    className="h-8 px-3 text-sm"
                    title="Clear Background"
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>
            
            <div className="w-px h-8 bg-gray-300" />
            
            {/* Save/Cancel Buttons */}
            {showSaveControls && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="h-9 px-4 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportToPDF}
                  className="h-9 px-4 text-sm"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Save as PDF
                </Button>
                <Button
                  onClick={() => onSave(elements, background, blurAmount)}
                  className="h-9 px-4 text-sm"
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto bg-gray-100 w-full">
        {/* Canvas Wrapper */}
        <div className="min-h-full w-full flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-lg rounded-lg overflow-hidden canvas-container flex-none"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              border: canvasBorderWidth > 0 ? `${canvasBorderWidth}px solid ${canvasBorderColor}` : 'none'
            }}
            onClick={handleCanvasClick}
          >
            {/* Background layer with blur effect */}
            {background && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${background})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: `blur(${blurAmount}px)`,
                  zIndex: 0
                }}
              />
            )}
            {elements.map((element) => (
            <div
              key={`${element.id}-${element.zIndex}`}
              className={`absolute group border-2 ${
                selectedElement === element.id && !readOnly
                  ? 'border-blue-500'
                  : 'border-transparent hover:border-gray-300'
              } ${element.locked ? 'opacity-50' : ''}`}
              style={{
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
                zIndex: element.zIndex || 0, // Use zIndex directly without +1
                cursor: readOnly ? 'default' : (element.locked ? 'not-allowed' : 'move'),
                opacity: (element.visible !== false) ? ((element.opacity || 100) / 100) : 0,
                // Remove border and borderRadius from container - will be applied to shapes individually
                boxShadow: element.frameType === 'shadow' ? '0 4px 8px rgba(0,0,0,0.1)' : undefined
              }}
              onClick={(e) => {
                if (readOnly) return;
                e.stopPropagation();
                selectElement(element.id);
              }}
            >
              {/* Drag Handle Layer - Invisible but clickable */}
              {!readOnly && (
              <div
                className="absolute inset-0"
                style={{ zIndex: 10 }}
                onMouseDown={(e) => {
                  if (!element.locked) {
                    e.stopPropagation();
                    e.preventDefault();
                    handleMouseDown(e, element.id);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectElement(element.id);
                }}
              />
              )}

              {element.type === 'text' && (
                <div
                  className="w-full h-full p-2 outline-none cursor-text relative z-20"
                  style={{
                    backgroundColor: element.backgroundColor || 'transparent',
                    border: element.borderColor ? `${element.borderWidth || 1}px solid ${element.borderColor}` : 'none',
                    borderRadius: `${element.borderRadius || 0}px`,
                    overflow: 'hidden',
                    pointerEvents: readOnly ? 'auto' : (selectedElement === element.id ? 'auto' : 'none')
                  }}
                >
                  <div
                    contentEditable={!readOnly && selectedElement === element.id}
                    suppressContentEditableWarning
                    tabIndex={0}
                    className="w-full h-full outline-none"
                    data-element-id={element.id}
                    style={{
                      color: element.color,
                      fontSize: `${element.fontSize}px`,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textDecoration: element.textDecoration,
                      textAlign: element.textAlign as any,
                      letterSpacing: `${element.letterSpacing}px`,
                      lineHeight: element.lineHeight,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word'
                    }}
                    ref={(el) => {
                      if (el) {
                        const currentText = element.text || 'Type here...';
                        if (el.innerHTML !== currentText) {
                          el.innerHTML = currentText;
                        }
                      }
                    }}
                    onBlur={(e) => {
                      updateElement(element.id, { text: e.currentTarget.innerHTML || '' });
                    }}
                    onInput={(e) => {
                      updateElement(element.id, { text: e.currentTarget.innerHTML || '' });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onSelect={(e) => {
                      e.stopPropagation();
                      try {
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0) {
                          const range = sel.getRangeAt(0).cloneRange();
                          savedRangeRef.current = range;
                        }
                      } catch (err) {
                        // ignore
                      }
                    }}
                    onKeyUp={() => {
                      try {
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0) {
                          savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                        }
                      } catch (err) {}
                    }}
                    onKeyDown={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.stopPropagation();
                      }
                    }}
                    dangerouslySetInnerHTML={selectedElement === element.id ? undefined : { __html: element.text || 'Type here...' }}
                  />
                </div>
              )}
              {element.type === 'rectangle' && (
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundColor: element.backgroundColor || '#3b82f6',
                    border: element.borderColor ? `${element.borderWidth || 1}px solid ${element.borderColor}` : 'none',
                    borderRadius: `${element.borderRadius || 0}px`,
                    opacity: (element.opacity || 100) / 100
                  }}
                />
              )}
              {element.type === 'circle' && (
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    backgroundColor: element.backgroundColor || '#3b82f6',
                    border: element.borderColor ? `${element.borderWidth || 1}px solid ${element.borderColor}` : 'none',
                    opacity: (element.opacity || 100) / 100
                  }}
                />
              )}
              {element.type === 'triangle' && (
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <polygon 
                    points="50,10 90,90 10,90" 
                    fill={element.backgroundColor || '#3b82f6'}
                    stroke={element.borderColor || '#000000'}
                    strokeWidth={element.borderWidth || 0}
                    opacity={(element.opacity || 100) / 100}
                  />
                </svg>
              )}
              {element.type === 'hexagon' && (
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <polygon 
                    points="50,5 90,25 90,75 50,95 10,75 10,25" 
                    fill={element.backgroundColor || '#3b82f6'}
                    stroke={element.borderColor || '#000000'}
                    strokeWidth={element.borderWidth || 0}
                    opacity={(element.opacity || 100) / 100}
                  />
                </svg>
              )}
              {element.type === 'star' && (
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <polygon 
                    points="50,10 61,35 88,35 67,52 78,78 50,60 22,78 33,52 12,35 39,35" 
                    fill={element.backgroundColor || '#3b82f6'}
                    stroke={element.borderColor || '#000000'}
                    strokeWidth={element.borderWidth || 0}
                    opacity={(element.opacity || 100) / 100}
                  />
                </svg>
              )}
              {element.type === 'image' && element.image && (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${element.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: (element.opacity || 100) / 100,
                      zIndex: 0 // Keep image at base level
                    }}
                  />
                  {/* Border overlay for image */}
                  {element.borderColor && element.borderWidth > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        border: `${element.borderWidth}px solid ${element.borderColor}`,
                        borderRadius: `${element.borderRadius || 0}px`,
                        zIndex: 5 // Keep border overlay at consistent level
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0 border-2 border-dashed border-gray-400"
                    style={{
                      pointerEvents: element.locked ? 'none' : 'auto',
                      zIndex: 10 // Keep selection handle at consistent level
                    }}
                    onClick={(e) => {
                      if (!element.locked) {
                        e.stopPropagation();
                        selectElement(element.id);
                      }
                    }}
                  />
                </>
              )}
              
              {/* Background Image Layer */}
              {element.type === 'background' && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${element.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: (element.opacity || 100) / 100,
                    zIndex: -1 // Keep background at lowest level
                  }}
                  onClick={(e) => {
                    if (!element.locked) {
                      e.stopPropagation();
                      selectElement(element.id);
                    }
                  }}
                />
              )}
              
              {/* Resize Handles - Only show when element is selected */}
              {selectedElement === element.id && !element.locked && (
                <>
                  {/* Visible drag handle at top-right: drag from here to move immediately */}
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 hover:bg-blue-600 rounded cursor-move z-40"
                    title="Drag to move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleMouseDown(e, element.id, true);
                    }}
                  />
                  {/* Corner handle for full resize */}
                  <div
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startResize(e, element.id, 'se');
                    }}
                  />
                  
                  {/* Width handle */}
                  <div
                    className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-e-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startResize(e, element.id, 'e');
                    }}
                  />
                  
                  {/* Height handle */}
                  <div
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-s-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startResize(e, element.id, 's');
                    }}
                  />
                  
                  {/* Left width handle */}
                  <div
                    className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-w-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startResize(e, element.id, 'w');
                    }}
                  />
                  
                  {/* Top height handle */}
                  <div
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-n-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startResize(e, element.id, 'n');
                    }}
                  />
                  
                  {/* Top-left corner handle */}
                  <div
                    className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-nw-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startResize(e, element.id, 'nw');
                    }}
                  />
                  
                  {/* Top-right corner: now only for drag (moved handle above, this one removed */}
                  
                  {/* Right edge handle */}
                  <div
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-sw-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startResize(e, element.id, 'sw');
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>

    </div>
  );
});

export default AdvancedCanvasEditor;