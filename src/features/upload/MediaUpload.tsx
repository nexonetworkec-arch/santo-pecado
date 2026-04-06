import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/src/services/mediaService';
import { Button } from '@/src/components/ui/Button';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/hooks/useAuth';

interface MediaUploadProps {
  onUploadComplete: () => void;
}

export default function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: () => mediaService.uploadMedia(
      user!.id, 
      file!, 
      file!.type.startsWith('video') ? 'video' : 'image', 
      caption
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setFile(null);
      setPreview(null);
      setCaption('');
      onUploadComplete();
    },
    onError: (err: any) => {
      setError(err.message || 'Error al subir el archivo.');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Solo se permiten imágenes y videos.');
      return;
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo ${isVideo ? '50MB' : '10MB'}.`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  if (!profile?.is_verified) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-8 text-center backdrop-blur-md">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
        <h3 className="text-xl font-bold text-amber-400">Acceso Restringido</h3>
        <p className="mt-2 text-sm text-amber-400/70 leading-relaxed">
          Solo los usuarios verificados pueden subir contenido multimedia. 
          Por favor, espera a que un administrador verifique tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
        className={`relative flex h-72 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 transition-all group ${uploadMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/10 hover:border-primary-500/50'}`}
      >
        {preview ? (
          <div className="relative h-full w-full p-3 flex items-center justify-center bg-black/40 rounded-2xl">
            {file?.type.startsWith('video') ? (
              <video src={preview} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
            ) : (
              <img src={preview} alt="Vista previa" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" referrerPolicy="no-referrer" />
            )}
            {!uploadMutation.isPending && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                  setError(null);
                }}
                className="absolute right-6 top-6 rounded-full bg-black/60 p-2 text-white hover:bg-primary-600 transition-colors shadow-lg backdrop-blur-md"
              >
                <X size={20} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 text-white/40 group-hover:text-white/60 transition-colors">
            <div className="p-4 rounded-full bg-white/5 group-hover:bg-primary-600/10 transition-colors">
              <Upload size={48} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-base font-bold">Haz clic para subir imagen o video</p>
            <p className="text-xs font-medium opacity-60">MP4, WebM, PNG, JPG hasta 50MB</p>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
          disabled={uploadMutation.isPending}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20"
          >
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {file && !error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <textarea
              placeholder="Añade un comentario..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              rows={3}
              disabled={uploadMutation.isPending}
            />

            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white/60 px-1">
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-primary-400" />
                    Subiendo contenido...
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary-600"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={() => uploadMutation.mutate()} 
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary-600/20" 
              isLoading={uploadMutation.isPending}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Publicando...' : 'Publicar Ahora'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
