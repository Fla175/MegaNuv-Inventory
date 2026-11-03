// components/settings/QRCodeBatchDownload.tsx
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useUser } from "@/lib/context/UserContext";

interface QRCodeBatchDownloadProps {
  hasPhysicalSpaces: boolean;
}

export default function QRCodeBatchDownload({ hasPhysicalSpaces }: QRCodeBatchDownloadProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apenas ADMIN e DIRECTOR podem ver/usar
  if (!user || (user.role !== 'ADMIN' && user.role !== 'DIRECTOR')) {
    return null;
  }

  const handleDownload = async () => {
    if (!hasPhysicalSpaces) {
      setError('Não existem espaços físicos cadastrados.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/qrcode-batch/generate-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao gerar arquivo' }));
        throw new Error(errorData.error || 'Erro ao gerar arquivo ZIP');
      }

      // Obter nome do arquivo do header
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'qrcodes.zip';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          fileName = match[1];
        }
      }

      // Baixar arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar arquivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={!hasPhysicalSpaces || loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
          !hasPhysicalSpaces || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
        }`}
        title={!hasPhysicalSpaces ? 'Não existem espaços físicos cadastrados' : 'Baixar QR Codes dos espaços físicos em ZIP'}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Baixar QR Codes em ZIP
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
      {!hasPhysicalSpaces && (
        <p className="text-xs text-gray-500 font-medium dark:text-gray-400">
          Nenhum espaço físico cadastrado
        </p>
      )}
    </div>
  );
}
