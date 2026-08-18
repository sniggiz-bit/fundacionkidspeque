"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Heart,
  ShoppingBag,
  Users,
  ShieldCheck,
  PhoneCall,
  ArrowUpRight
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
}

// ── Preguntas rápidas ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { text: "✨ ¿Cómo donar?", icon: Heart, intent: "donar" },
  { text: "📝 Registrar un sueño", icon: Sparkles, intent: "registrar" },
  { text: "🛍️ Tienda solidaria", icon: ShoppingBag, intent: "tienda" },
  { text: "🙋 Quiero ser voluntario", icon: Users, intent: "voluntario" },
  { text: "🔒 Seguridad y RUT", icon: ShieldCheck, intent: "transparencia" },
] as const;

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializar mensaje de bienvenida al montar el cliente
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: "¡Hola! 🌟 Soy el asistente virtual de Fundación Kidspeque. ¿En qué puedo orientarte hoy? Selecciona una opción rápida o escríbeme directamente.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Mostrar una notificación de saludo inicial si no está abierto
  useEffect(() => {
    if (!isOpen && messages.length === 1) {
      const timer = setTimeout(() => {
        setUnreadCount(1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages]);

  // ── Lógica de Respuestas Inteligentes (Clasificador Local) ───────────────────
  const getBotResponse = (input: string): string => {
    const text = input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // quitar tildes

    // Intención: Donar
    if (
      text.includes("dona") ||
      text.includes("dono") ||
      text.includes("dinero") ||
      text.includes("aportar") ||
      text.includes("pago") ||
      text.includes("pagar") ||
      text.includes("webpay") ||
      text.includes("flow") ||
      text.includes("paypal") ||
      text.includes("clp") ||
      text.includes("peso") ||
      text.includes("monto")
    ) {
      return "En Fundación Kidspeque puedes cumplir sueños reales donando desde $1.000 CLP. El proceso es 100% seguro mediante Webpay, Flow o PayPal. Ve a la sección 'Dona en segundos' en nuestra página de inicio para aportar. Además, tu aporte es deducible de impuestos bajo el Art. 69 de la Ley sobre Impuesto a la Renta. 💙";
    }

    // Intención: Registrar Sueños
    if (
      text.includes("sueno") ||
      text.includes("registrar") ||
      text.includes("propon") ||
      text.includes("subir") ||
      text.includes("postular") ||
      text.includes("nino") ||
      text.includes("nina") ||
      text.includes("historia")
    ) {
      return "¡Qué hermoso que quieras postular el sueño de un niño/a! 👶 Puedes hacerlo directamente completando el formulario público en la pestaña superior 'Registrar Sueño' o visitando: /suenos/registrar. Cada propuesta es evaluada por nuestro equipo de moderación antes de ser activada para recibir aportes.";
    }

    // Intención: Tienda Solidaria
    if (
      text.includes("tienda") ||
      text.includes("ropa") ||
      text.includes("delantal") ||
      text.includes("compra") ||
      text.includes("comprar") ||
      text.includes("vestido") ||
      text.includes("pantalon") ||
      text.includes("producto")
    ) {
      return "En nuestra Tienda Solidaria vendemos prendas premium y accesorios para niños, como vestidos de algodón orgánico GOTS y delantales antimanchas. Lo más importante: ¡el 100% de la utilidad va directamente a financiar los sueños de los niños! Puedes ver el catálogo en la sección 'Tienda' de la página principal o en: /tienda. 🛍️";
    }

    // Intención: Voluntariado
    if (
      text.includes("voluntario") ||
      text.includes("voluntariado") ||
      text.includes("beca") ||
      text.includes("ayudar") ||
      text.includes("colaborar") ||
      text.includes("unirse") ||
      text.includes("tiempo") ||
      text.includes("red")
    ) {
      return "¡Buscamos corazones dispuestos a ayudar! 🙋 Aceptamos profesionales (psicólogos, trabajadores sociales), artistas (talleristas creativos) y voluntarios en general que deseen regalar su tiempo y talento. Puedes ver los detalles en la sección 'Colabora' en la Home o inscribirte en: /voluntariado.";
    }

    // Intención: Contacto
    if (
      text.includes("contacto") ||
      text.includes("correo") ||
      text.includes("email") ||
      text.includes("telefono") ||
      text.includes("celular") ||
      text.includes("direccion") ||
      text.includes("oficina")
    ) {
      return "Nos puedes escribir a contacto@kidspeque.cl o llamarnos al +56 2 2345 6789. Nuestro horario de atención al cliente es de Lunes a Viernes de 09:00 a 17:00 hrs. ¡Estaremos encantados de conversar contigo! 📞";
    }

    // Intención: Transparencia / Legal
    if (
      text.includes("transparencia") ||
      text.includes("rut") ||
      text.includes("personalidad") ||
      text.includes("juridica") ||
      text.includes("seguro") ||
      text.includes("confianza") ||
      text.includes("legal") ||
      text.includes("impuesto")
    ) {
      return "Fundación Kidspeque (Fundación Social Niños Creativos) cuenta con Personalidad Jurídica N° XXXX/2024. Somos una organización regulada y comprometida con el 100% de transparencia. Todas las donaciones a campañas generan un recibo de donación inmediato y son deducibles de impuestos bajo el Art. 69 LIR. Puedes revisar la información legal completa al pie de nuestra web. 🔒";
    }

    // Fallback
    return "Entiendo tu consulta. Sin embargo, para brindarte una atención más detallada y resolver tu duda de forma personalizada, puedes derivar esta consulta a un coordinador real a través de WhatsApp presionando el botón de abajo.👇";
  };

  // ── Enviar Mensaje ──────────────────────────────────────────────────────────
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simular escritura natural (1.2 segundos de delay)
    setTimeout(() => {
      const replyText = getBotResponse(text);
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: replyText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  // ── Exportar chat a WhatsApp ───────────────────────────────────────────────
  const handleExportToWhatsApp = () => {
    // Formatear la conversación
    let chatHistoryText = "¡Hola Fundación Kidspeque! Estaba chateando con su asistente virtual y me gustaría continuar la conversación con un coordinador humano.\n\n";
    chatHistoryText += "📝 *Historial del chat:*\n";

    // Mapear los últimos 8 mensajes para no saturar el texto del URL
    const recentMessages = messages.slice(-8);
    recentMessages.forEach((msg) => {
      const senderName = msg.sender === "bot" ? "🤖 Asistente" : "👤 Yo";
      chatHistoryText += `${senderName}: ${msg.text}\n`;
    });

    const encodedText = encodeURIComponent(chatHistoryText);
    const phoneNumber = "56223456789"; // Número por defecto (+56 2 2345 6789)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Botón flotante principal (FAB) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadCount(0);
        }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        aria-label="Abrir chat de ayuda"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <MessageCircle size={26} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-3.5 -right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md border border-white"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
      </button>

      {/* Ventana de chat desplegable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute bottom-18 right-0 w-[360px] max-w-[90vw] h-[520px] bg-white rounded-3xl border border-neutral-100 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header del Chat */}
            <div className="bg-gradient-to-r from-violet-700 to-violet-600 text-white p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                  🤖
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm leading-tight flex items-center gap-1.5">
                    Kidspeque Bot
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-violet-200">Asistente Virtual</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Cerrar chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Zona de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
              {messages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${!isBot ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold select-none flex-shrink-0 ${
                        isBot ? "bg-violet-100 text-violet-700" : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {isBot ? "🤖" : "👤"}
                    </div>

                    {/* Burbuja de Texto */}
                    <div className="max-w-[75%] space-y-1">
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isBot
                            ? "bg-white text-neutral-800 border border-neutral-100 shadow-xs"
                            : "bg-violet-600 text-white shadow-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className={`block text-[9px] text-neutral-400 ${!isBot ? "text-right" : ""}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Animación "Escribiendo..." */}
              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-xs flex-shrink-0">
                    🤖
                  </div>
                  <div className="bg-white border border-neutral-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sugerencias Rápidas */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 pt-2 bg-neutral-50/50 border-t border-neutral-100">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Preguntas frecuentes</p>
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pb-1">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.intent}
                        onClick={() => handleSendMessage(action.text)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-full hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 shadow-2xs transition-colors"
                      >
                        <Icon size={11} className="text-violet-600" />
                        {action.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botón WhatsApp prioritario si ya hay conversación */}
            {messages.length > 1 && (
              <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-2">
                <span className="text-[10px] text-neutral-500 leading-tight">¿Prefieres ayuda humana directa?</span>
                <button
                  onClick={handleExportToWhatsApp}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                >
                  <PhoneCall size={11} />
                  WhatsApp
                  <ArrowUpRight size={11} />
                </button>
              </div>
            )}

            {/* Input y Botón Enviar */}
            <div className="p-3 border-t border-neutral-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage(inputValue);
                }}
                placeholder="Escribe tu duda aquí..."
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                maxLength={400}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim()}
                className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar mensaje"
              >
                <Send size={14} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
