import { createFileRoute } from "@tanstack/react-router";
import { usePortal, fileToDataUrl } from "@/lib/portal-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MobilePreview } from "@/components/MobilePreview";
import { ImageIcon, Upload, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMerchantMe, updateMerchantPartner } from "@/lib/api";
import { useEffect } from "react";
import { useMerchantAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

const profileSchema = z.object({
  business_name: z.string().min(1, "El nombre de la empresa es obligatorio"),
  tagline: z.string().nullable().optional(),
  profile_description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  brand_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color hexadecimal inválido")
    .nullable()
    .optional(),
  contact_email: z
    .string()
    .email("Correo inválido")
    .nullable()
    .optional()
    .or(z.literal("")),
  website_url: z
    .string()
    .url("URL inválida")
    .nullable()
    .optional()
    .or(z.literal("")),
  logo_url: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfilePage() {
  const queryClient = useQueryClient();
  const { updateCompany } = usePortal();
  const { merchantPartner, merchantUser } = useMerchantAuth();

  const {
    data,
    isLoading: isFetching,
    isError,
  } = useQuery({
    queryKey: ["merchantMe"],
    queryFn: getMerchantMe,
    initialData: merchantUser && merchantPartner ? { 
      id: merchantUser.id, 
      merchant_partners: merchantPartner 
    } : undefined,
  });

  const partner = data?.merchant_partners;

  // Add debug logs
  console.log("Context partner:", merchantPartner);
  console.log("Query status:", { isFetching, isError, data });
  console.log("Partner data to load:", partner);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      business_name: "",
      tagline: "",
      profile_description: "",
      category: "",
      brand_color: "#000000",
      contact_email: "",
      website_url: "",
      logo_url: "",
      banner_url: "",
    },
  });

  // Reset form when data is loaded
  useEffect(() => {
    if (partner) {
      form.reset({
        business_name: partner.business_name || "",
        tagline: partner.tagline || "",
        profile_description: partner.profile_description || "",
        category: partner.category || "",
        brand_color: partner.brand_color || "#000000",
        contact_email: partner.contact_email || "",
        website_url: partner.website_url || "",
        logo_url: partner.logo_url || "",
        banner_url: partner.banner_url || "",
      });
    }
  }, [partner, form]);

  // Sync form state to the global portal store for live MobilePreview
  const currentValues = form.watch();
  useEffect(() => {
    updateCompany({
      name: currentValues.business_name || "",
      tagline: currentValues.tagline || "",
      description: currentValues.profile_description || "",
      category: currentValues.category || "",
      brandColor: currentValues.brand_color || "#000000",
      email: currentValues.contact_email || "",
      website: currentValues.website_url || "",
      logo: currentValues.logo_url || "",
      cover: currentValues.banner_url || "",
    });
  }, [currentValues, updateCompany]);

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) => updateMerchantPartner(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchantMe"] });
      toast.success("Perfil actualizado correctamente");
    },
    onError: (error: any) => {
      if (error instanceof Error) {
        toast.error(`Backend: ${error.message}`);
      } else if (error?.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Ocurrió un error al guardar el perfil.");
      }
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    mutation.mutate(values);
  };

  const onUpload = async (key: "logo_url" | "banner_url", file?: File) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    form.setValue(key, url, { shouldDirty: true, shouldValidate: true });
    toast.success(`${key === "logo_url" ? "Logo" : "Portada"} actualizado en el formulario`);
  };

  if (isFetching) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 md:p-10">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl font-medium">
          Error al cargar el perfil. Por favor, intenta de nuevo.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Perfil de marca</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personaliza cómo se ve tu empresa en la app. Recuerda guardar los cambios.
          </p>
        </div>
        <Button
          type="submit"
          className="shrink-0"
          disabled={mutation.isPending || !form.formState.isDirty}
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-8">
        <div className="space-y-6">
          {/* Cover & logo */}
          <Section title="Imagen visual" subtitle="Logo y portada que verán los usuarios.">
            <div className="rounded-2xl overflow-hidden border border-border">
              <div
                className="relative h-44 group"
                style={{
                  background: currentValues.banner_url
                    ? `url(${currentValues.banner_url}) center/cover`
                    : `linear-gradient(135deg, ${currentValues.brand_color}, oklch(0.82 0.16 85))`,
                }}
              >
                <UploadButton onPick={(f) => onUpload("banner_url", f)} label="Cambiar portada" />
              </div>
              <div className="flex items-end gap-4 px-5 -mt-10 pb-5 relative">
                <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-md overflow-hidden flex items-center justify-center relative group shrink-0">
                  {currentValues.logo_url ? (
                    <img
                      src={currentValues.logo_url}
                      alt={currentValues.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-muted-foreground" />
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Upload className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onUpload("logo_url", e.target.files?.[0])}
                    />
                  </label>
                </div>
                <div className="mb-1 truncate">
                  <div className="font-semibold truncate">
                    {currentValues.business_name || "Nombre"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {currentValues.tagline || "Tagline"}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Identity */}
          <Section title="Identidad" subtitle="Nombre, tagline y descripción.">
            <div className="space-y-4">
              <Row label="Nombre de la empresa" error={form.formState.errors.business_name?.message}>
                <Input
                  {...form.register("business_name")}
                  placeholder="Tu empresa"
                  className={form.formState.errors.business_name ? "border-red-500" : ""}
                />
              </Row>
              <Row label="Tagline corto" error={form.formState.errors.tagline?.message}>
                <Input
                  {...form.register("tagline")}
                  placeholder="Una frase que te describa"
                />
              </Row>
              <Row label="Descripción" error={form.formState.errors.profile_description?.message}>
                <Textarea
                  rows={4}
                  {...form.register("profile_description")}
                  placeholder="Cuéntanos más sobre ti..."
                />
              </Row>
              <div className="grid sm:grid-cols-2 gap-4">
                <Row label="Categoría" error={form.formState.errors.category?.message}>
                  <Input {...form.register("category")} placeholder="Ej. Restaurante" />
                </Row>
                <Row label="Color de marca" error={form.formState.errors.brand_color?.message}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentValues.brand_color || "#000000"}
                      onChange={(e) => form.setValue("brand_color", e.target.value, { shouldDirty: true, shouldValidate: true })}
                      className="w-10 h-10 rounded-lg border border-border bg-transparent cursor-pointer shrink-0"
                    />
                    <Input
                      {...form.register("brand_color")}
                      className={form.formState.errors.brand_color ? "border-red-500" : ""}
                    />
                  </div>
                </Row>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contacto" subtitle="Cómo los usuarios y nuestro equipo pueden contactarte.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Row label="Correo" error={form.formState.errors.contact_email?.message}>
                <Input
                  type="email"
                  {...form.register("contact_email")}
                  placeholder="contacto@empresa.com"
                  className={form.formState.errors.contact_email ? "border-red-500" : ""}
                />
              </Row>
              <Row label="Sitio web" error={form.formState.errors.website_url?.message}>
                <Input
                  {...form.register("website_url")}
                  placeholder="https://empresa.com"
                  className={form.formState.errors.website_url ? "border-red-500" : ""}
                />
              </Row>
            </div>
          </Section>

          <div className="flex items-center gap-2 p-4 rounded-xl bg-accent/15 border border-accent/30">
            <Sparkles className="w-4 h-4 text-accent-foreground shrink-0" />
            <p className="text-sm">
              Tus cambios se ven reflejados en el preview lateral al instante, pero recuerda pulsar "Guardar cambios" para persistirlos en el sistema.
            </p>
          </div>
        </div>

        {/* Live preview */}
        <div className="hidden lg:block sticky top-6 self-start">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 text-center font-semibold">
            Preview en vivo
          </div>
          <MobilePreview />
        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      {children}
    </div>
  );
}

function UploadButton({ onPick, label }: { onPick: (f?: File) => void; label: string }) {
  return (
    <label className="absolute right-3 bottom-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur border border-border text-xs font-medium cursor-pointer hover:bg-background flex items-center gap-1.5 shadow-sm transition-colors">
      <Upload className="w-3.5 h-3.5" />
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </label>
  );
}
