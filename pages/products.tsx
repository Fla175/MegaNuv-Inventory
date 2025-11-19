import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Pencil, X } from 'lucide-react'; // Adicionei o X

// Interfaces (Mantidas)
interface Item {
  id: string;
  name: string;
  sku: string | null;
  contaAzulId: string | null;
  stockQuantity: number;
  price: number;
  cost: number | null;
  status: string;
  tags?: string[]; 
  lastContaAzulSync: string | null;
}

const LOCATION_SKU = "INTERNAL_LOCATION_SPACE";

export default function ProductsPage() {

  {/* Estados */}
  const [products, setProducts] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null); // Estado para o Modal de Edição

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/items/list', { credentials: 'include' });
      if (!response.ok) throw new Error('Falha ao buscar produtos.');
      const data = await response.json();
      setProducts(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPhysicalSpace = (product: Item): boolean => {
    return product.sku === LOCATION_SKU;
  };

  // Função para salvar a edição
  const handleUpdateProduct = async (updatedData: Partial<Item>) => {
    try {
      const response = await fetch('/api/items/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Erro ao atualizar');
      }

      alert('Produto atualizado com sucesso!');
      setEditingItem(null); // Fecha o modal
      fetchProducts(); // Recarrega a lista
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <Layout><div className="flex justify-center py-10">Carregando...</div></Layout>;
  if (error) return <Layout><div className="text-red-600 py-10 text-center">Erro: {error}</div></Layout>;

  return (
    <Layout title="Definição de Produtos - MegaNuv Inventory">
      <Head><title>Definição de Produtos</title></Head>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Definição de Produtos (Conta Azul)</h1>
        
        {products.length === 0 ? (
          <p className="text-center text-gray-600">Nenhum produto encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
              <thead className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                <tr>
                  <th className="py-3 px-6 text-left">Nome</th>
                  <th className="py-3 px-6 text-left">SKU</th>
                  <th className="py-3 px-6 text-left">Qtd.</th>
                  <th className="py-3 px-6 text-left">Preço</th>
                  <th className="py-3 px-6 text-left">Custo</th>
                  <th className="py-3 px-6 text-left">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th> {/* Nova Coluna */}
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {products
                  .filter((product) => !isPhysicalSpace(product))
                  .map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{product.name}</td>
                      <td className="py-3 px-6 text-left">{product.sku || 'N/A'}</td>
                      <td className="py-3 px-6 text-left">{product.stockQuantity}</td>
                      <td className="py-3 px-6 text-left">R$ {product.price?.toFixed(2).replace('.', ',')}</td>
                      <td className="py-3 px-6 text-left">R$ {product.cost?.toFixed(2).replace('.', ',') || 'N/A'}</td>
                      <td className="py-3 px-6 text-left">
                        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${product.status === 'ATIVO' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button 
                          onClick={() => setEditingItem(product)}
                          className="transform hover:scale-110 text-blue-500 hover:text-blue-700 transition"
                          title="Editar Produto"
                        >
                          <Pencil size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingItem && (
        <EditProductModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSave={handleUpdateProduct} 
        />
      )}
    </Layout>
  );
}

// --- Sub-componente do Modal (Pode ficar no mesmo arquivo) ---
function EditProductModal({ item, onClose, onSave }: { item: Item, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    id: item.id,
    name: item.name,
    sku: item.sku || '',
    price: item.price,
    cost: item.cost || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Pencil size={20} className="text-blue-600"/> Editar Produto
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800">Nome</label>
            <input 
              type="text" 
              required
              className="mt-1 w-full border border-gray-400 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-600"
              placeholder={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">SKU</label>
              <input 
                type="text" 
                required
                className="mt-1 w-full border border-gray-400 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
                placeholder={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
             {/* Espaço vazio ou outro campo */}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">Preço (Venda)</label>
              <input 
                type="number" step="0.01"
                className="mt-1 w-full border border-gray-400 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
                value={formData.price}
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800">Custo (Aquisição)</label>
              <input 
                type="number" step="0.01"
                className="mt-1 w-full border border-gray-400 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-md">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}