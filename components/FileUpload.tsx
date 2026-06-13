// components/FileUpload.tsx
import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, FileText, Link as LinkIcon, Plus, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { UseToast } from '@/lib/context/ToastContext';

interface FileUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxFiles?: number;
}

// Função auxiliar para extrair dados da URL e definir o visual
const getFileDetails = (url: string) => {
  const rawFilename = url.split('/').pop()?.split('?')[0] || 'link-anexado';
  const displayName = decodeURIComponent(rawFilename);
  
  const extMatch = displayName.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extMatch ? extMatch[1].toLowerCase() : 'link';

  let Icon = LinkIcon;
  let colorClass = 'text-gray-500';
  let bgClass = 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700';

  if (extension === 'pdf') {
    Icon = FileText;
    colorClass = 'text-red-500';
    bgClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
  } else if (['doc', 'docx'].includes(extension)) {
    Icon = FileIcon;
    colorClass = 'text-blue-500';
    bgClass = 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50';
  } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
    Icon = ImageIcon;
    colorClass = 'text-emerald-500';
    bgClass = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50';
  }

  return { displayName, extension, Icon, colorClass, bgClass };
};

const getFileExtension = (urlOrPath: string): string => {
  if (!urlOrPath) return '';

  const cleanPath = urlOrPath.split('?')[0];
  const extension = cleanPath.split('.').pop()?.toLowerCase() || '';
  return extension && extension !== cleanPath.toLowerCase() ? `.${extension}` : '';
};

export default function FileUpload({ 
  value = [], 
  onChange, 
  label = "Documentos",
  maxFiles = 5 
}: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = UseToast();

  const currentFiles = Array.isArray(value) ? value : [];

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    if (currentFiles.length >= maxFiles) {
      toast.showWarning(`Você só pode anexar até ${maxFiles} arquivos.`);
      return;
    }
    onChange([...currentFiles, linkInput.trim()]);
    setLinkInput('');
  };

  const handleRemoveFile = async (indexToRemove: number) => {
    const fileUrl = currentFiles[indexToRemove];

    try {
      setLoading(true);

      // Faz a chamada para a sua API existente usando o método DELETE
      const res = await fetch('/api/storage/delete-url', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fileUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao remover o arquivo do servidor.');
      }

      // Se a exclusão no MinIO deu certo, atualiza o estado local
      const newFiles = currentFiles.filter((_, index) => index !== indexToRemove);
      onChange(newFiles);
      toast.showSuccess('Arquivo removido com sucesso.');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao tentar remover o arquivo.';
      toast.showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Captura múltiplos arquivos
    let selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // 2. Valida o limite de arquivos
    const availableSlots = maxFiles - currentFiles.length;
    if (selectedFiles.length > availableSlots) {
      toast.showWarning(`Você só pode enviar mais ${availableSlots} arquivo(s). Os extras foram ignorados.`);
      selectedFiles = selectedFiles.slice(0, availableSlots); // Corta a array para não passar do limite
    }

    const allowedTypes = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', 'image/png', 'image/jpeg', 'application/pdf'];
    const validFiles: File[] = [];

    // 3. Validações individuais (Tipo e Tamanho)
    for (const file of selectedFiles) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAllowed = allowedTypes.some(type => 
        fileExtension === type.toLowerCase() || file.type === type
      );

      if (!isAllowed) {
        toast.showWarning(`Arquivo "${file.name}" recusado: tipo não permitido.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.showWarning(`Arquivo "${file.name}" recusado: tamanho acima de 5MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 4. Envio em lote (Batch Upload)
    try {
      setLoading(true);
      const newUploadedUrls: string[] = [];

      // Mapeia os arquivos para Promises de upload simultâneas
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/storage/upload-url', {
          method: 'POST',
          body: formData,
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Erro no upload de ${file.name}`);
        
        return data.publicUrl as string;
      });

      // Executa os uploads simultaneamente e coleta os resultados usando Promise.allSettled 
      // (Isso evita que todos falhem caso apenas um arquivo dê erro)
      const results = await Promise.allSettled(uploadPromises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          newUploadedUrls.push(result.value);
        } else {
          toast.showError(`Erro ao enviar "${validFiles[index].name}": ${result.reason.message}`);
        }
      });

      // Atualiza o estado com as URLs que tiveram sucesso
      if (newUploadedUrls.length > 0) {
        onChange([...currentFiles, ...newUploadedUrls]);
        if (newUploadedUrls.length === validFiles.length) {
          toast.showSuccess(`${newUploadedUrls.length} arquivo(s) enviado(s) com sucesso.`);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro crítico ao enviar arquivos.';
      toast.showError(errorMessage);
    } finally {
      setLoading(false);
      // Limpa o input file para permitir selecionar o mesmo arquivo novamente, se necessário
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const canAddMore = currentFiles.length < maxFiles;

  return (
    <div className="mb-4">
      <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-2 block">
        {label} ({currentFiles.length}/{maxFiles})
      </label>
      
      {currentFiles.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {currentFiles.map((url, index) => {
            const fileExtension = getFileExtension(url);
            const { displayName, extension, Icon, colorClass, bgClass } = getFileDetails(url);
            
            return (
              <div key={index} className={`flex items-center justify-between border rounded-xl p-2 transition-colors ${bgClass}`}>
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div className={`p-1.5 bg-white dark:bg-zinc-950 rounded-lg shadow-sm ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate hover:underline"
                      title={displayName}
                    >
                      {displayName}
                    </a>
                    {extension !== 'link' && (
                      <span className={`text-[10px] font-black uppercase tracking-wider ${colorClass}`}>
                        .{extension}
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => handleRemoveFile(index)}
                  disabled={loading}
                  className={`p-1.5 ml-2 rounded-lg text-gray-400 ${ ['.doc', '.docx'].includes(fileExtension) ? "hover:bg-blue-100 hover:text-blue-500" : ['.png', '.jpg', '.jpeg'].includes(fileExtension) ? "hover:bg-emerald-100 hover:text-emerald-500" : "hover:bg-red-100 hover:text-red-500" } transition-colors shrink-0`}
                  title="Remover arquivo"
                >
                  <X size={14}/>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {canAddMore && (
        <>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input 
                    type="text" 
                    placeholder="Cole um link..." 
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                />
            </div>
            <button 
              type="button"
              onClick={handleAddLink}
              disabled={!linkInput.trim()}
              className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 p-2 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>

          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className="relative w-full h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 dark:bg-zinc-900 hover:border-indigo-400 transition-all cursor-pointer overflow-hidden flex items-center justify-center gap-2"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
              className="hidden" 
              multiple 
            />
            
            {loading ? (
              <><Loader2 className="animate-spin text-indigo-600" size={16}/> <span className="text-[10px] font-bold text-indigo-600">Enviando arquivos...</span></>
            ) : (
              <><UploadCloud className="text-gray-400" size={16}/> <span className="text-[10px] pl-2 font-bold text-gray-400 uppercase">Enviar documento(s)</span></>
            )}
          </div>
        </>
      )}
    </div>
  );
}