import os

file_path = r'c:\Users\zaher\Downloads\adminsite\src\components\canvas-editor\AdvancedCanvasEditor.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the code to insert
code_to_insert = """
  useImperativeHandle(ref, () => ({
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
                .replace(/<\/div><div>/gi, '\\n')
                .replace(/<br\s*\/?>/gi, '\\n')
                .replace(/<div>/gi, '')
                .replace(/<\/div>/gi, '\\n')
                .replace(/<\/p>/gi, '\\n')
                .replace(/<p[^>]*>/gi, '')
                .replace(/<[^>]*>/g, '')
                .replace(/^\\n+/, '')
                .replace(/\\n+$/, '');
              
              const lines = cleanText.split('\\n');
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
"""

anchor = "const colorInputRef = useRef<HTMLInputElement | null>(null);"
if anchor in content:
    content = content.replace(anchor, anchor + "\n" + code_to_insert)
    print("Found anchor and inserted code.")
else:
    print("Anchor not found!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated AdvancedCanvasEditor.tsx")
