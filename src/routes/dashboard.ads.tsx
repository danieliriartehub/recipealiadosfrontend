import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, ChangeEvent } from 'react'
import { useMerchantAuth } from '@/lib/auth'
import { backendApi } from '@/lib/backendApi'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Megaphone, Image as ImageIcon, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { usePortal } from '@/lib/portal-store'

export const Route = createFileRoute('/dashboard/ads')({
  head: () => ({ meta: [{ title: 'Publicidad — Portal de Aliados' }] }),
  component: DashboardAds,
})

function DashboardAds() {
  const { session } = useMerchantAuth()
  const { company } = usePortal()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedImage || !session?.access_token || !company.id) return

    setIsUploading(true)
    try {
      const img = new Image()
      img.src = selectedImage

      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = canvasRef.current
      if (!canvas) throw new Error('No canvas element')

      // Mantener proporción (ej: Max width 1200)
      let width = img.width
      let height = img.height
      const MAX_WIDTH = 1200
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No 2d context')
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a webp (calidad 0.85)
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Error al procesar la imagen')
          setIsUploading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', blob, 'banner.webp')

        try {
          const api = backendApi.withToken(session.access_token)
          // Asume que route es /api/v1/aliados/partner/{partner_id}/banner
          const res = await api.postForm<{ banner_url: string }>(`/api/v1/aliados/partner/${company.id}/banner`, formData)
          
          toast.success('¡Banner actualizado exitosamente!')
          setSelectedImage(res.banner_url)
        } catch (error: any) {
          toast.error(error.message || 'Error al subir el banner')
        } finally {
          setIsUploading(false)
        }
      }, 'image/webp', 0.85)

    } catch (error: any) {
      toast.error('Ocurrió un error al procesar la imagen')
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" />
          Publicidad
        </h1>
        <p className="text-muted-foreground mt-1">
          Atrae a más alumnos configurando un banner publicitario que se mostrará en el inicio de la App de Alumnos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subida de Imagen */}
        <Card>
          <CardHeader>
            <CardTitle>Banner de Marca</CardTitle>
            <CardDescription>
              Sube una imagen atractiva (promociones, nuevos productos). Será optimizada automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="banner-upload">Seleccionar imagen</Label>
              <Input 
                id="banner-upload" 
                type="file" 
                accept="image/*" 
                className="cursor-pointer"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            {selectedImage ? (
              <div className="relative mt-4 border rounded-xl overflow-hidden aspect-[21/9] bg-muted group">
                <img src={selectedImage} alt="Banner preview" className="w-full h-full object-cover" />
                <button 
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-4 border-2 border-dashed rounded-xl aspect-[21/9] bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-sm">Ninguna imagen seleccionada</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedImage || isUploading}
              className="w-full"
            >
              {isUploading ? 'Subiendo...' : 'Publicar Banner'}
              {!isUploading && <Upload className="w-4 h-4 ml-2" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Preview en App Alumnos */}
        <Card className="bg-slate-50 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Vista Previa - App Alumnos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex justify-center pb-8">
            {/* Mockup del celular */}
            <div className="w-[320px] h-[600px] bg-white rounded-[3rem] border-[8px] border-slate-900 shadow-xl overflow-hidden relative flex flex-col">
              {/* Status bar mock */}
              <div className="h-6 bg-slate-100 flex items-center justify-between px-6 text-[10px] text-slate-500 font-medium">
                <span>9:41</span>
                <div className="flex gap-1">
                  <span>LTE</span>
                  <span>100%</span>
                </div>
              </div>
              
              {/* App Header */}
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-xl font-bold text-slate-800">Hola, Alumno 👋</h3>
                <p className="text-xs text-slate-500">¿Listo para reciclar hoy?</p>
              </div>

              {/* Banner Preview */}
              <div className="px-4 mt-2">
                {selectedImage ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-sm bg-slate-200 aspect-[21/9]">
                    <img src={selectedImage} className="w-full h-full object-cover" alt="Ad" />
                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm p-1 rounded-full text-white cursor-pointer hover:bg-black/60">
                      <X className="w-3 h-3" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                      Publicidad
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 aspect-[21/9] flex items-center justify-center text-slate-400 bg-slate-50">
                    <span className="text-xs font-medium">Espacio publicitario</span>
                  </div>
                )}
              </div>

              {/* Other App Content mock */}
              <div className="px-4 mt-6 grid grid-cols-2 gap-3">
                <div className="h-24 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-green-200 mb-1" />
                  <div className="w-16 h-2 bg-green-200 rounded-full" />
                </div>
                <div className="h-24 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-200 mb-1" />
                  <div className="w-16 h-2 bg-blue-200 rounded-full" />
                </div>
              </div>
              
              <div className="px-4 mt-4">
                <div className="h-4 w-32 bg-slate-200 rounded-full mb-3" />
                <div className="space-y-2">
                  <div className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
                  <div className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Smartphone(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  )
}
