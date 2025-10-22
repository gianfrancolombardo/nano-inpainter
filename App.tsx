
// Fix: Corrected the import statement for React and useState.
import React, { useState } from 'react';
import ImageEditor from './components/ImageEditor';
import ResultViewer from './components/ResultViewer';
import { editImageWithMask } from './services/geminiService';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMaskedImage, setLastMaskedImage] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');


  const handleEdit = async (imageWithMask: string, prompt: string) => {
    if (!originalImage) return;

    setLastMaskedImage(imageWithMask);
    setLastPrompt(prompt);

    setIsLoading(true);
    setError(null);
    try {
      const result = await editImageWithMask(imageWithMask, prompt);
      setEditedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setError(null);
    setIsLoading(false);
    setLastMaskedImage(null);
    setLastPrompt('');
  };

  const handleNewImage = (imageFile: File) => {
    setOriginalImage(imageFile);
    setEditedImage(null);
    setError(null);
    setLastMaskedImage(null);
    setLastPrompt('');
  }

  const handleRetry = () => {
    if (lastMaskedImage) {
      handleEdit(lastMaskedImage, lastPrompt);
    } else {
      setError("No se pudo reintentar. Faltan los datos de la máscara y el prompt.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-7xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Reparador de Imágenes Gemini
        </h1>
        <p className="text-gray-400 mt-3 text-lg">
          Pinta sobre lo que no te guste y deja que la IA haga su magia.
        </p>
      </header>
      
      <main className="w-full max-w-7xl flex-grow flex flex-col items-center justify-center">
        {isLoading && <Spinner message="Gemini está haciendo de las suyas..." />}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4 rounded-lg relative text-center max-w-2xl">
            <strong className="font-bold block text-lg mb-1">¡Houston, tenemos un problema!</strong>
            <span className="block">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-red-500/20 transition-colors"
              aria-label="Cerrar mensaje de error"
            >
              <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Cerrar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {editedImage && originalImage ? (
              <ResultViewer
                originalSrc={URL.createObjectURL(originalImage)}
                editedSrc={editedImage}
                onReset={handleReset}
                onRetry={handleRetry}
              />
            ) : (
              <ImageEditor 
                onEdit={handleEdit} 
                onNewImage={handleNewImage}
                currentImageFile={originalImage}
              />
            )}
          </>
        )}
      </main>

      <footer className="w-full max-w-7xl text-center mt-12 text-gray-500 text-sm">
        <p>Hecho con ❤️ y Gemini de Google</p>
      </footer>
    </div>
  );
};

export default App;