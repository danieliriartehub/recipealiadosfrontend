import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadCloud, Send, X, Bot, User, CheckCircle2, Leaf, Coffee, Store, Package, Shirt, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAccessToken } from "@/lib/auth";

const API_URL = import.meta.env.VITE_API_URL ?? '';

export type ChatProductPayload = {
  name: string;
  description: string;
  points: number;
  stock: number;
  category: string;
  image_url: string;
  expiration_days: number;
};

type Step = "name" | "description" | "points" | "stock" | "expiration" | "category" | "image" | "confirm";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  type?: "text" | "image" | "categories";
  imageUrl?: string;
};

const CATEGORY_OPTIONS = [
  { label: "Alimentos", icon: <Coffee className="w-4 h-4" /> },
  { label: "Merchandising", icon: <Shirt className="w-4 h-4" /> },
  { label: "Servicios", icon: <Store className="w-4 h-4" /> },
  { label: "Hogar y Eco", icon: <Leaf className="w-4 h-4" /> },
  { label: "General", icon: <Package className="w-4 h-4" /> },
];

export function ChatbotProductCreator({
  onComplete,
  onCancel,
  isPending,
}: {
  onComplete: (data: ChatProductPayload) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [step, setStep] = useState<Step>("name");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "bot", text: "¡Hola! 👋 Soy tu asistente de catálogo. Vamos a agregar un nuevo producto." },
    { id: "2", sender: "bot", text: "¿Cuál es el nombre del producto que vamos a publicar hoy?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [payload, setPayload] = useState<Partial<ChatProductPayload>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addBotMessage = (text: string, delay = 800, type: "text" | "categories" = "text") => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", text, type }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text: string, type: "text" | "image" = "text", imageUrl?: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text, type, imageUrl }]);
  };

  const handleSend = () => {
    if (!inputValue.trim() && step !== "image") return;
    
    const value = inputValue.trim();
    
    switch (step) {
      case "name":
        addUserMessage(value);
        setPayload((p) => ({ ...p, name: value }));
        setInputValue("");
        
        setIsTyping(true);
        addBotMessage("¡Excelente nombre! 🌟 Déjame usar la IA de RECIPE para crear una descripción mágica...", 0);
        
        (async () => {
          try {
            const token = getAccessToken();
            const res = await fetch(`${API_URL}/api/v1/aliados/generate-product-details`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ name: value })
            });
            if (!res.ok) throw new Error("Error IA");
            const data = await res.json();
            
            setPayload((p) => ({ ...p, description: data.description, category: data.category }));
            
            setStep("points");
            addBotMessage(`¡Hecho! ✨ Le asigné la categoría "${data.category}" y esta descripción:\n\n«${data.description}»\n\n(Podrás editarlo luego si deseas). Ahora, ¿cuántos Puntos ECO costará?`, 600);
          } catch (e) {
            setStep("description");
            addBotMessage(`Hubo un problemita con la IA 😅. Escribe tú mismo una descripción atractiva para ${value}.`, 600);
          } finally {
            setIsTyping(false);
          }
        })();
        break;
        
      case "description":
        addUserMessage(value);
        setPayload((p) => ({ ...p, description: value }));
        setInputValue("");
        setStep("points");
        addBotMessage("¡Suena genial! 🚀 ¿Cuántos Puntos ECO costará este producto para los estudiantes?", 600);
        break;

      case "points":
        const points = parseInt(value);
        if (isNaN(points) || points <= 0) {
          addUserMessage(value);
          setInputValue("");
          addBotMessage("Hmm... parece que no es un número válido. Por favor ingresa un número mayor a 0 para los Puntos ECO.", 400);
          return;
        }
        addUserMessage(`${points} Puntos ECO`);
        setPayload((p) => ({ ...p, points }));
        setInputValue("");
        setStep("stock");
        addBotMessage("¡Anotado! 📈 ¿Cuántas unidades (stock) de este producto tienes disponibles ahora mismo?", 600);
        break;

      case "stock":
        const stock = parseInt(value);
        if (isNaN(stock) || stock < 0) {
          addUserMessage(value);
          setInputValue("");
          addBotMessage("Por favor ingresa un número válido (0 o mayor) para el stock.", 400);
          return;
        }
        addUserMessage(`${stock} unidades`);
        setPayload((p) => ({ ...p, stock }));
        setInputValue("");
        setStep("expiration");
        addBotMessage("¡Anotado! ⏳ ¿Cuántos días de vigencia tendrá el cupón una vez canjeado? (ej. 30 días)", 600);
        break;

      case "expiration":
        const expiration_days = parseInt(value);
        if (isNaN(expiration_days) || expiration_days <= 0) {
          addUserMessage(value);
          setInputValue("");
          addBotMessage("Por favor ingresa un número válido (mayor a 0) para los días de expiración.", 400);
          return;
        }
        addUserMessage(`${expiration_days} días`);
        setPayload((p) => ({ ...p, expiration_days }));
        setInputValue("");
        setStep("category");
        addBotMessage("Perfecto. ¿En qué categoría encaja mejor tu producto? Puedes elegir una de estas opciones o escribir la tuya.", 600, "categories");
        break;

      case "category":
        addUserMessage(value);
        setPayload((p) => ({ ...p, category: value }));
        setInputValue("");
        setStep("image");
        addBotMessage("¡Casi terminamos! 📸 Por último, sube una foto nítida de tu producto. Una buena imagen atrae muchos más canjes.", 600);
        break;

      default:
        break;
    }
  };

  const handleCategorySelect = (cat: string) => {
    setInputValue(cat);
    handleSend(); // Auto-send isn't working if we don't await state, so let's inline it
    addUserMessage(cat);
    setPayload((p) => ({ ...p, category: cat }));
    setInputValue("");
    setStep("image");
    addBotMessage("¡Casi terminamos! 📸 Por último, sube una foto nítida de tu producto. Una buena imagen atrae muchos más canjes.", 600);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      addUserMessage("Imagen adjunta", "image", imageUrl);
      setPayload((p) => ({ ...p, image_url: imageUrl }));
      setStep("confirm");
      addBotMessage("¡Todo listo! 🎉 He preparado tu producto para publicación. Revisa los detalles en pantalla. ¿Lo publicamos?", 800);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-[650px] max-h-[85vh] bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#008000]/10 p-2 rounded-full">
            <Bot className="w-6 h-6 text-[#008000]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Asistente de Catálogo</h3>
            <p className="text-xs text-[#008000] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#008000] inline-block animate-pulse"></span> En línea
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground hover:bg-muted">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-end gap-2 max-w-[85%]">
                {msg.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-[#008000]/10 flex items-center justify-center shrink-0 mb-1">
                    <Bot className="w-3.5 h-3.5 text-[#008000]" />
                  </div>
                )}
                
                <div 
                  className={`rounded-2xl px-4 py-2.5 shadow-sm text-[15px] ${
                    msg.sender === "user" 
                      ? "bg-[#008000] text-white rounded-br-sm" 
                      : "bg-white border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.type === "image" && msg.imageUrl ? (
                    <img src={msg.imageUrl} alt="Uploaded preview" className="w-48 h-auto rounded-lg mb-1 shadow-md object-cover" />
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
              
              {/* Categorias Quick Replies */}
              {msg.type === "categories" && step === "category" && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-2 mt-3 pl-8"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => handleCategorySelect(cat.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#008000]/30 hover:border-[#008000] hover:bg-[#008000]/5 rounded-full text-sm text-[#008000] font-medium transition-colors shadow-sm"
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-[#008000]/10 flex items-center justify-center shrink-0 mb-1">
              <Bot className="w-3.5 h-3.5 text-[#008000]" />
            </div>
            <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Confirmation Card Overlay */}
      {step === "confirm" && !isTyping && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 bg-white border-2 border-[#008000] rounded-xl p-4 shadow-lg z-20"
        >
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-muted rounded-lg shrink-0 overflow-hidden border">
              <img src={payload.image_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-lg leading-tight">{payload.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{payload.category}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-accent/20 text-accent-foreground px-2 py-0.5 rounded text-xs font-bold border border-accent/30">
                    {payload.points} pts
                  </span>
                  {payload.expiration_days && (
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Expira en {payload.expiration_days} días
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">{payload.description}</p>
              <div className="mt-3 flex gap-2">
                <Button 
                  className="flex-1 bg-[#008000] hover:bg-[#008000]/90 text-white" 
                  size="sm"
                  disabled={isPending}
                  onClick={() => onComplete(payload as ChatProductPayload)}
                >
                  {isPending ? "Publicando..." : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Publicar ahora</>}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      {step !== "confirm" && (
        <div className="p-3 bg-background border-t">
          {step === "image" ? (
            <div className="flex flex-col gap-2">
              <Label className="cursor-pointer">
                <div className="border-2 border-dashed border-[#008000]/40 bg-[#008000]/5 hover:bg-[#008000]/10 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center group">
                  <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-[#008000]" />
                  </div>
                  <span className="text-sm font-medium text-[#008000]">Haz clic aquí para subir la foto</span>
                  <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP recomendado</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </Label>
            </div>
          ) : (
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="flex gap-2 items-end relative"
            >
              {step === "description" ? (
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe la descripción aquí..."
                  className="min-h-[50px] max-h-[120px] resize-none pr-12 rounded-2xl bg-muted/50 border-muted focus-visible:ring-[#008000]/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              ) : (
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    step === "name" ? "Ej: Botella de Aluminio Ecológica..." :
                    step === "points" ? "Ej: 250" :
                    step === "stock" ? "Ej: 50" :
                    step === "expiration" ? "Ej: 30" :
                    step === "category" ? "Escribe la categoría..." : "..."
                  }
                  type={step === "points" || step === "stock" || step === "expiration" ? "number" : "text"}
                  className="h-12 pr-12 rounded-2xl bg-muted/50 border-muted focus-visible:ring-[#008000]/50"
                  autoFocus
                  min={step === "points" || step === "expiration" ? 1 : step === "stock" ? 0 : undefined}
                />
              )}
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1.5 bottom-1.5 h-9 w-9 rounded-xl bg-[#008000] hover:bg-[#008000]/90 text-white shrink-0 disabled:opacity-50"
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
