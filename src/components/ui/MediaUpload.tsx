import React, { useState, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Image, Video, X, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MediaUpload({ isOpen, onClose, onSuccess }: MediaUploadProps) {
  const { user, profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Solo se permiten imágenes y videos.');
      return;
    }

    // Validate file size (e.g., 50MB for videos, 10MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo ${isVideo ? '50MB' : '10MB'}.`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !user || !profile) return;
    
    if (!profile.is_verified) {
      setError('Debes estar verificado para subir contenido.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setProgress(60);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // 3. Insert into Database
      const { error: dbError } = await supabase
        .from('media')
        .insert({
          user_id: user.id,
          url: publicUrl,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          caption: caption.trim() || null
        });

      if (dbError) throw dbError;
      
      setProgress(100);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error al subir el archivo. Asegúrate de que el bucket "media" exista y sea público.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setError(null);
    setProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg"
      >
        <Card className="glass-card border-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Upload size={20} className="text-primary-400" />
              Nueva Publicación
            </CardTitle>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {!preview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video w-full rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary-500/50 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 group"
              >
                <div className="rounded-full bg-primary-600/20 p-4 text-primary-400 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">Selecciona una foto o video</p>
                  <p className="text-white/40 text-sm mt-1">O arrastra y suelta aquí</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 ring-1 ring-white/10">
                  {file?.type.startsWith('video/') ? (
                    <video src={preview} className="h-full w-full object-contain" controls />
                  ) : (
                    <img src={preview} alt="Preview" className="h-full w-full object-contain" />
                  )}
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/60 ml-1">Pie de foto (opcional)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escribe algo sobre esta publicación..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all min-h-[100px] resize-none"
                  />
                </div>
              </div>
            )}

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

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white/60 px-1">
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-primary-400" />
                    Subiendo contenido...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1 text-white/60 hover:text-white hover:bg-white/5"
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 shadow-lg shadow-primary-600/20"
                isLoading={uploading}
              >
                {uploading ? 'Publicando...' : 'Publicar Ahora'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
