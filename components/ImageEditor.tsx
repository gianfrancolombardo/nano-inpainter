
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrushIcon, ClearIcon, RedoIcon, UndoIcon } from './icons';

interface ImageEditorProps {
  onEdit: (imageWithMask: string, prompt: string) => void;
  onNewImage: (imageFile: File) => void;
  currentImageFile: File | null;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; title: string; disabled?: boolean; isActive?: boolean }> = ({ onClick, children, title, disabled, isActive }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isActive ? 'bg-purple-600 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}
    >
        {children}
    </button>
);


const ImageEditor: React.FC<ImageEditorProps> = ({ onEdit, onNewImage, currentImageFile }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [brushSize, setBrushSize] = useState<number>(40);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isBrushSliderVisible, setIsBrushSliderVisible] = useState(false);
  
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const history = useRef<ImageData[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const saveToHistory = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) return;
    
    const imageData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    
    setHistoryIndex(prevIndex => {
      const newHistory = history.current.slice(0, prevIndex + 1);
      newHistory.push(imageData);
      history.current = newHistory;
      return newHistory.length - 1;
    });
  }, []);

  const clearMask = useCallback((saveState: boolean = true) => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) return;
    maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    
    if (saveState) {
        saveToHistory();
    } else {
        const initialImageData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        history.current = [initialImageData];
        setHistoryIndex(0);
    }
  }, [saveToHistory]);

  const drawImageOnCanvas = useCallback(() => {
    if (!imageRef.current || !imageCanvasRef.current || !maskCanvasRef.current) return;

    const image = imageRef.current;
    const drawWidth = image.naturalWidth;
    const drawHeight = image.naturalHeight;
    
    imageCanvasRef.current.width = maskCanvasRef.current.width = drawWidth;
    imageCanvasRef.current.height = maskCanvasRef.current.height = drawHeight;
    
    const imageCtx = imageCanvasRef.current.getContext('2d');
    imageCtx?.drawImage(image, 0, 0, drawWidth, drawHeight);

    clearMask(false);
  }, [clearMask]);

  useEffect(() => {
    if (currentImageFile && (!imageRef.current || imageRef.current.src !== URL.createObjectURL(currentImageFile))) {
        const img = new Image();
        img.src = URL.createObjectURL(currentImageFile);
        img.onload = () => {
            imageRef.current = img;
            drawImageOnCanvas();
        };
    }
  }, [currentImageFile, drawImageOnCanvas]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
                setIsBrushSliderVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onNewImage(file);
    }
  };

  const restoreFromHistory = useCallback(() => {
    if (!maskCanvasRef.current || historyIndex < 0 || !history.current[historyIndex]) return;
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) return;
    
    const imageData = history.current[historyIndex];
    maskCtx.putImageData(imageData, 0, 0);
  }, [historyIndex]);
  
  useEffect(() => {
    restoreFromHistory();
  }, [historyIndex, restoreFromHistory]);

  const undo = () => {
    if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.current.length - 1) {
        setHistoryIndex(historyIndex + 1);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    if (!maskCtx) return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    maskCtx.beginPath();
    maskCtx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    if (!maskCtx) return;
    
    const { x, y } = getCanvasCoordinates(e);
    maskCtx.lineTo(x, y);
    maskCtx.strokeStyle = 'rgb(236, 72, 153)'; // Solid color
    maskCtx.lineWidth = brushSize;
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    if (!maskCtx) return;
    maskCtx.closePath();
    setIsDrawing(false);
    saveToHistory();
  };

  const handleSubmit = async () => {
    if (!imageCanvasRef.current || !maskCanvasRef.current) return;
    
    const binaryMaskCanvas = document.createElement('canvas');
    binaryMaskCanvas.width = maskCanvasRef.current.width;
    binaryMaskCanvas.height = maskCanvasRef.current.height;
    const binaryCtx = binaryMaskCanvas.getContext('2d', { willReadFrequently: true });
    if (!binaryCtx) return;

    const maskCtx = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) return;
    const originalMaskData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    const binaryMaskData = binaryCtx.createImageData(originalMaskData.width, originalMaskData.height);

    for (let i = 0; i < originalMaskData.data.length; i += 4) {
      if (originalMaskData.data[i + 3] > 0) {
        binaryMaskData.data[i] = 0;
        binaryMaskData.data[i + 1] = 0;
        binaryMaskData.data[i + 2] = 0;
        binaryMaskData.data[i + 3] = 255;
      }
    }
    binaryCtx.putImageData(binaryMaskData, 0, 0);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = imageCanvasRef.current.width;
    offscreenCanvas.height = imageCanvasRef.current.height;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(imageCanvasRef.current, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(binaryMaskCanvas, 0, 0);

    const imageWithMaskDataUrl = offscreenCanvas.toDataURL('image/png');
    onEdit(imageWithMaskDataUrl, prompt || "Borra el área enmascarada.");
  };

  if (!currentImageFile) {
    return (
      <div className="w-full max-w-2xl text-center flex items-center justify-center p-4">
        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 w-full bg-gray-900/50">
          <svg className="mx-auto h-16 w-16 text-gray-600" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-5 text-xl font-medium text-gray-300">Sube una imagen para empezar la fiesta</p>
          <p className="mt-2 text-sm text-gray-500">Recomendamos PNG, JPG, WEBP</p>
          <label htmlFor="file-upload" className="mt-8 inline-block cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg">
            Elegir una Imagen
          </label>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-[auto_1fr] items-start gap-4">
      {/* Toolbar */}
      <div ref={toolbarRef} className="relative flex flex-col gap-3 p-3 bg-gray-900 rounded-xl shadow-lg border border-gray-700/50 sticky top-6">
        <div className="relative">
            <ToolbarButton onClick={() => setIsBrushSliderVisible(!isBrushSliderVisible)} title="Pincel" isActive>
                <BrushIcon className="w-7 h-7" />
            </ToolbarButton>
            {isBrushSliderVisible && (
                <div className="absolute left-full top-0 ml-3 p-3 flex flex-col items-center gap-2 bg-gray-800 rounded-lg shadow-2xl border border-gray-700/50 z-10">
                    <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-24 cursor-pointer"
                        aria-label="Tamaño del pincel"
                    />
                    <span className="text-sm w-12 text-center font-mono bg-gray-900/50 rounded-md p-1">{brushSize}</span>
                </div>
            )}
        </div>
        <ToolbarButton onClick={undo} title="Deshacer" disabled={historyIndex <= 0}>
            <UndoIcon className="w-7 h-7" />
        </ToolbarButton>
        <ToolbarButton onClick={redo} title="Rehacer" disabled={historyIndex >= history.current.length - 1}>
            <RedoIcon className="w-7 h-7" />
        </ToolbarButton>
        <ToolbarButton onClick={() => clearMask()} title="Limpiar Máscara">
            <ClearIcon className="w-7 h-7" />
        </ToolbarButton>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Canvas */}
        <div className="flex-grow w-full flex items-center justify-center p-4 bg-black/20 rounded-xl border border-gray-700/50 min-h-[400px]">
          <div className="relative w-max max-w-full h-max max-h-full shadow-2xl rounded-lg overflow-hidden">
              <canvas ref={imageCanvasRef} className="block max-w-full h-auto" />
              <canvas 
                ref={maskCanvasRef} 
                className="absolute top-0 left-0 cursor-crosshair"
                style={{ opacity: 0.7 }} // Opacity applied to the whole canvas
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-full flex flex-col md:flex-row gap-4 items-start p-5 bg-gray-900 rounded-xl shadow-lg border border-gray-700/50">
            <div className="flex-grow w-full flex flex-col gap-2">
                <label htmlFor="prompt" className="text-sm font-medium text-gray-400">Instrucciones (Opcional)</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="p.ej., 'borra el coche rojo'"
                  className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                />
            </div>
            <div className="w-full md:w-56 flex flex-col gap-3 pt-0 md:pt-7">
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                ¡Hazlo desaparecer!
              </button>
              <button
                onClick={() => onNewImage(null as any)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Usar Otra Imagen
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
