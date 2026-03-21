// components/FileUpload.tsx
import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, FileText, Link as LinkIcon } from 'lucide-react';

interface FileUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function FileUpload({ value, onChange, label = "Datasheet / PDF" }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação simples de tamanho (ex: 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("Arquivo muito grande. Máximo 5MB.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await fetch('/api/storage/upload-url', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no upload");
      
      onChange(data.publicUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-2 block">{label}</label>
      
      {/* Área de Input Manual do Link */}
      <div className="flex gap-2 mb-2">
         <div className="relative flex-1">
            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input 
                type="text" 
                placeholder="Cole um link ou faça upload..." 
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:border-indigo-500 outmodel-none"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            />
         </div>
      </div>

      {/* Área de Upload */}
      <div 
        onClick={() => !loading && fileInputRef.current?.click()}
        className={`relative w-full h-16 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex items-center justify-center gap-2
          ${value ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-200 bg-gray-50 dark:bg-zinc-900 hover:border-indigo-400'}`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx" className="hidden" />
        
        {loading ? (
           <><Loader2 className="animate-spin text-indigo-600" size={16}/> <span className="text-[10px] font-bold text-indigo-600">Enviando...</span></>
        ) : value ? (
           <>
              <FileText className="text-emerald-600" size={20}/>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[200px]">Arquivo Vinculado</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-colors"><X size={14}/></button>
           </>
        ) : (
           <>
              <UploadCloud className="text-gray-400" size={16}/>
              <span className="text-[10px] pl-2 font-bold text-gray-400 uppercase">Enviar PDF</span>
           </>
        )}
      </div>
    </div>
  );
}