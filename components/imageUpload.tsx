// components/imageUpload.tsx
import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { UseToast } from '@/lib/context/ToastContext';
import Image from 'next/image';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Imagem" }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = UseToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await fetch('/api/storage/upload-url', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      
       try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || "Erro no upload");
        onChange(data.publicUrl);
        toast.showSuccess('Imagem enviada com sucesso.');
      } catch {
        toast.showError('Erro no servidor. Verifique a conexão e tente novamente.');
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar imagem.';
      toast.showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value) {
      try {
        // Envia uma requisição DELETE com a URL que está guardada no estado 'value'
        const res = await fetch('/api/storage/delete-file', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value }),
        });
  
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao remover imagem");
        
        toast.showSuccess('Imagem removida com sucesso do servidor.');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido.';
        toast.showError(`Erro ao remover a imagem do servidor: ${errorMessage}`);
      }
    }
    onChange(null);
  };

  return (
    <div className="mb-6">
      <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-2 block">{label}</label>
      <div 
        onClick={() => !loading && fileInputRef.current?.click()}
        className={`relative w-full h-44 rounded-[2rem] border border-dashed border-gray-500 transition-all cursor-pointer overflow-hidden
          ${value ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-400'}`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
        
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-600 bg-white/80 dark:bg-zinc-800 backdrop-blur-sm z-10">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest">Enviando via Servidor...</span>
          </div>
        ) : value ? (
          <>
            <Image
              src={value}
              fill
              alt="Preview"
              className="w-full h-full object-cover bg-white/ dark:bg-zinc-800"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <button type="button" onClick={handleDelete} className="bg-white p-2 rounded-xl text-red-500 shadow-lg"><X size={20}/></button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray dark:bg-zinc-800">
            <UploadCloud size={28} className="mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Clique para enviar</span>
          </div>
        )}
      </div>
    </div>
  );
}