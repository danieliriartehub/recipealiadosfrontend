import { createFileRoute } from "@tanstack/react-router";
import { useMerchantAuth, getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Coins, Package, ImageIcon, Leaf, UploadCloud, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatbotProductCreator, type ChatProductPayload } from "@/components/ChatbotProductCreator";

// 1. Zod Schema
const productSchema = z.object({
  image_url: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  points: z.coerce.number().min(1, "Debe ser al menos 1 punto"),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
  expiration_days: z.coerce.number().min(1, "Debe ser al menos 1 día").optional(),
  category: z.string().min(1, "La categoría es requerida"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export type Product = ProductFormValues & { id: string };

const API_URL = import.meta.env.VITE_API_URL ?? '';

// Helper de peticiones
const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.status !== 204 ? res.json() : undefined;
};

// 2. Custom Hooks TanStack Query
function useProductsHooks(aliado_id?: string) {
  const queryClient = useQueryClient();

  const useGetProducts = () => useQuery({
    queryKey: ['products', aliado_id],
    queryFn: () => fetchWithAuth(`/api/v1/aliados/products/${aliado_id}`) as Promise<Product[]>,
    enabled: !!aliado_id,
  });

  const useCreateProduct = () => useMutation({
    mutationFn: (data: ProductFormValues) =>
      fetchWithAuth(`/api/v1/aliados/products`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          merchant_partner_id: aliado_id
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', aliado_id] }),
  });

  const useUpdateProduct = () => useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormValues }) =>
      fetchWithAuth(`/api/v1/aliados/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', aliado_id] }),
  });

  const useDeleteProduct = () => useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/v1/aliados/products/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', aliado_id] }),
  });

  return { useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct };
}

export const Route = createFileRoute("/dashboard/products")({
  component: ProductsPage,
});

// Convierte un archivo a base64 (para demo de subida)
export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function ProductsPage() {
  const { merchantPartner } = useMerchantAuth();
  const aliado_id = merchantPartner?.id;
  
  const { useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } = useProductsHooks(aliado_id);
  
  const { data: products = [], isLoading, isError } = useGetProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [open, setOpen] = useState(false);
  const [openChatbot, setOpenChatbot] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      points: 100,
      stock: 10,
      expiration_days: 30,
      image_url: "",
      category: "Hogar",
    },
  });

  const openNew = () => {
    setOpenChatbot(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    form.reset({
      name: p.name,
      description: p.description,
      points: p.points,
      stock: p.stock,
      expiration_days: p.expiration_days || 30,
      image_url: p.image_url || "",
      category: p.category,
    });
    setOpen(true);
  };

  const onImage = async (file?: File) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    form.setValue("image_url", url);
  };

  const onSubmit = (data: ProductFormValues) => {
    const payload = { ...data };
    if (payload.image_url && payload.image_url.startsWith("data:image")) {
      toast.info("Subida a Storage pendiente de implementar. Se enviará una URL de demostración.");
      payload.image_url = "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=80";
    }

    if (editing) {
      updateProduct.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Producto actualizado");
            setOpen(false);
          },
          onError: (e) => toast.error(e.message || "Error al actualizar"),
        }
      );
    }
  };

  const handleChatbotSubmit = (data: ChatProductPayload) => {
    const payload = { ...data };
    if (payload.image_url && payload.image_url.startsWith("data:image")) {
      toast.info("Subida a Storage pendiente de implementar. Se enviará una URL de demostración.");
      payload.image_url = "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=80";
    }

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast.success("Producto publicado con éxito");
        setOpenChatbot(false);
      },
      onError: (e) => toast.error(e.message || "Error al publicar"),
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    deleteProduct.mutate(id, {
      onSuccess: () => toast.success("Producto eliminado"),
      onError: (e) => toast.error(e.message || "Error al eliminar"),
    });
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Catálogo de productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} producto{products.length === 1 ? "" : "s"} disponible
            {products.length === 1 ? "" : "s"} para canje.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-[#008000] hover:bg-[#008000]/90 text-white">
          <Plus className="w-4 h-4" /> Nuevo producto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive">
          Ocurrió un error al cargar los productos.
        </div>
      ) : products.length === 0 ? (
        <EmptyState onAdd={openNew} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard 
              key={p.id} 
              p={p} 
              onEdit={() => openEdit(p)} 
              onDelete={() => handleDelete(p.id)} 
              isDeleting={deleteProduct.isPending && deleteProduct.variables === p.id}
            />
          ))}
        </div>
      )}

      <Dialog open={openChatbot} onOpenChange={setOpenChatbot}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-background border-0 shadow-2xl [&>button]:hidden sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Asistente de Catálogo</DialogTitle>
          </DialogHeader>
          <ChatbotProductCreator 
            onComplete={handleChatbotSubmit} 
            onCancel={() => setOpenChatbot(false)} 
            isPending={createProduct.isPending} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <Controller
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <ImagePicker
                  image={field.value || ""}
                  onPick={(f) => onImage(f)}
                  onClear={() => field.onChange("")}
                />
              )}
            />

            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                {...form.register("name")}
                placeholder="Ej: Botella reutilizable"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                rows={3}
                {...form.register("description")}
                placeholder="Detalles, materiales, vigencia..."
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Puntos</Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register("points")}
                />
                {form.formState.errors.points && (
                  <p className="text-xs text-destructive">{form.formState.errors.points.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min={0}
                  {...form.register("stock")}
                />
                {form.formState.errors.stock && (
                  <p className="text-xs text-destructive">{form.formState.errors.stock.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Vigencia (Días)</Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register("expiration_days")}
                />
                {form.formState.errors.expiration_days && (
                  <p className="text-xs text-destructive">{form.formState.errors.expiration_days.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Input
                  {...form.register("category")}
                  placeholder="Ej: Hogar"
                />
                {form.formState.errors.category && (
                  <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#008000] hover:bg-[#008000]/90 text-white">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImagePicker({
  image,
  onPick,
  onClear,
}: {
  image: string;
  onPick: (f?: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">Imagen</Label>
      <label className="cursor-pointer block">
        <div className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors flex flex-col items-center justify-center overflow-hidden relative">
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <div className="p-3 bg-background rounded-full shadow-sm">
                <UploadCloud className="w-6 h-6 text-primary" />
              </div>
              <span>Click para subir imagen o arrastra un archivo</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>
      {image && (
        <button
          onClick={onClear}
          type="button"
          className="text-xs text-muted-foreground hover:text-destructive mt-1.5 font-medium"
        >
          Quitar imagen
        </button>
      )}
    </div>
  );
}

function ProductCard({
  p,
  onEdit,
  onDelete,
  isDeleting
}: {
  p: Product;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Leaf className="w-10 h-10 text-primary/60" />
          </div>
        )}
        <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md text-[10px] font-semibold text-foreground border border-border/50">
          {p.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold leading-tight text-foreground">{p.name}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{p.description}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/20">
            <Coins className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-semibold text-accent-foreground">{p.points.toLocaleString()}</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Stock: {p.stock}
          </span>
        </div>
        <div className="flex gap-2 mt-5">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 font-medium" onClick={onEdit} disabled={isDeleting}>
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center bg-card">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
        <Package className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-foreground text-lg">Aún no tienes productos</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
        Publica tu primer producto para empezar a recibir canjes de usuarios que reciclan.
      </p>
      <Button onClick={onAdd} className="mt-6 gap-2 bg-[#008000] hover:bg-[#008000]/90 text-white">
        <Plus className="w-4 h-4" /> Crear producto
      </Button>
    </div>
  );
}

