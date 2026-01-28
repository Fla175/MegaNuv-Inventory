// components/imageUpload.tsx
import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Imagem" }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } catch (parseError) {
        console.error("Conteúdo recebido do servidor:", text);
        alert("O SERVIDOR ENVIOU HTML EM VEZ DE JSON. INÍCIO DO ERRO:\n\n" + text.substring(0, 500));
        return;
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-2 block">{label}</label>
      <div 
        onClick={() => !loading && fileInputRef.current?.click()}
        className={`relative w-full h-44 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden
          ${value ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-400'}`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
        
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-600 bg-white/80 backdrop-blur-sm z-10">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest">Enviando via Servidor...</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="bg-white p-2 rounded-xl text-red-500 shadow-lg"><X size={20}/></button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <UploadCloud size={28} className="mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Clique para enviar</span>
          </div>
        )}
      </div>
    </div>
  );
}