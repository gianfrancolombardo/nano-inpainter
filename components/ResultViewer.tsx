
import React, { useState, useRef, useEffect } from 'react';
import { RetryIcon } from './icons';

interface ResultViewerProps {
  originalSrc: string;
  editedSrc: string;
  onReset: () => void;
  onRetry: () => void;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ originalSrc, editedSrc, onReset, onRetry }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = editedSrc;
    link.download = 'imagen-editada.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Clean up object URLs when component unmounts
    return () => {
      URL.revokeObjectURL(originalSrc);
    }
  }, [originalSrc]);

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-8">
      <div
        ref={containerRef}
        className="relative w-full aspect-auto rounded-xl overflow-hidden select-none border-2 border-gray-700/50 shadow-2xl"
      >
        <div className="absolute top-3 left-3 z-10 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none backdrop-blur-sm">
            ORIGINAL
        </div>
        <div className="absolute top-3 right-3 z-10 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none backdrop-blur-sm">
            EDITADA
        </div>
        <img src={originalSrc} alt="Original" className="block w-full h-auto pointer-events-none" />
        <div
          className="absolute top-0 left-0 h-full w-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img src={editedSrc} alt="Editada" className="block w-full h-auto pointer-events-none" />
        </div>
        <div
            className="absolute top-0 h-full w-1 bg-white/80 cursor-ew-resize"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/80 flex items-center justify-center backdrop-blur-md border-2 border-white shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
            </div>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-ew-resize"
          aria-label="Deslizador de comparación de imágenes"
        />
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-base flex items-center gap-2 transform hover:scale-105 shadow-lg"
        >
          <RetryIcon className="w-5 h-5"/>
          <span>Otro Intento</span>
        </button>
        <button
          onClick={handleDownload}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-base transform hover:scale-105 shadow-lg"
        >
          Descargar Resultado
        </button>
        <button
          onClick={onReset}
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base"
        >
          Empezar de Nuevo
        </button>
      </div>
    </div>
  );
};

export default ResultViewer;
