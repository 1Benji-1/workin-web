import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { Message, ConversationWithDetails, MessageAttachment } from "@freelance/types";
import { formatMessageDate } from "@freelance/core";
import { useAuth } from "../../shared/context/AuthContext";
import { Button } from "@freelance/ui";

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<{ success: boolean; error?: string }>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onBackToList?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  loading,
  sending,
  onSendMessage,
  messagesEndRef,
  onBackToList,
}) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentsList, setAttachmentsList] = useState<MessageAttachment[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mb-3">
          💬
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Tus Mensajes y Conversaciones
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Selecciona una conversación de la lista para ver el historial y chatear en tiempo real, o inicia un chat desde un pedido.
        </p>
      </div>
    );
  }

  const isClient = user?.id === conversation.clientId;
  const counterpart = isClient ? conversation.freelancer : conversation.client;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachmentsList.length === 0) return;

    setSendError(null);
    const res = await onSendMessage(
      inputText.trim(),
      attachmentsList.length > 0 ? attachmentsList : undefined
    );

    if (res.success) {
      setInputText("");
      setAttachmentsList([]);
    } else if (res.error) {
      setSendError(res.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) return;
    const name = attachmentName.trim() || attachmentUrl.split("/").pop() || "Archivo adjunto";
    setAttachmentsList((prev) => [...prev, { name, url: attachmentUrl.trim() }]);
    setAttachmentUrl("");
    setAttachmentName("");
    setShowAttachmentModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50">
      {/* Cabecera del Chat */}
      <div className="h-16 px-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg"
              aria-label="Volver a lista"
            >
              ←
            </button>
          )}

          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden font-bold text-slate-700 text-sm shrink-0">
            {counterpart?.avatarUrl ? (
              <img
                src={counterpart.avatarUrl}
                alt={counterpart.fullName || "Usuario"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(counterpart?.fullName || "U")[0].toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {counterpart?.fullName || "Usuario de WorkIn"}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {isClient ? conversation.freelancer?.headline || "Freelancer Profesional" : "Cliente"}
            </p>
          </div>
        </div>

        {/* Ficha de Pedido Vinculado */}
        {conversation.order && (
          <Link
            to={`/orders/${conversation.order.id}`}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 transition-colors shrink-0"
          >
            <span className="font-semibold truncate max-w-[140px] sm:max-w-[200px]">
              📋 {conversation.order.title}
            </span>
            <span className="text-[10px] font-bold text-primary bg-white px-1.5 py-0.5 rounded border border-slate-200">
              ${conversation.order.price} USD
            </span>
          </Link>
        )}
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 text-xs py-12">
            <span className="text-2xl mb-1">💬</span>
            <p className="font-medium text-slate-600">Comienza la conversación</p>
            <p className="text-[11px] mt-0.5 max-w-xs">
              Escribe un mensaje para coordinar requerimientos, hacer preguntas o enviar entregables.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = user?.id === msg.senderId;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
              >
                {!isMine && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 mb-1 overflow-hidden">
                    {msg.sender?.avatarUrl ? (
                      <img src={msg.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(msg.sender?.fullName || "U")[0].toUpperCase()}</span>
                    )}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[70%] space-y-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap break-words ${
                      isMine
                        ? "bg-primary text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                    }`}
                  >
                    {msg.content}

                    {/* Adjuntos */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/20 space-y-1.5">
                        {msg.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-1.5 rounded text-[11px] transition-colors ${
                              isMine
                                ? "bg-white/10 hover:bg-white/20 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            <span>📎</span>
                            <span className="truncate underline font-medium">{att.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp y Read receipt */}
                  <div
                    className={`flex items-center gap-1 text-[10px] text-slate-400 px-1 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>{formatMessageDate(msg.createdAt)}</span>
                    {isMine && (
                      <span className={msg.isRead ? "text-primary font-bold" : "text-slate-400"}>
                        {msg.isRead ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Lista de adjuntos pendientes de envío */}
      {attachmentsList.length > 0 && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-2">
          {attachmentsList.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs text-slate-700 shadow-2xs"
            >
              <span>📎</span>
              <span className="truncate max-w-[150px] font-medium">{att.name}</span>
              <button
                type="button"
                onClick={() => setAttachmentsList((prev) => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-red-600 ml-1 font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Barra de Entrada de Texto */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        {sendError && (
          <p className="text-xs text-red-600 mb-2 px-1">⚠️ {sendError}</p>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowAttachmentModal(true)}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Adjuntar archivo o enlace"
          >
            📎
          </button>

          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para salto de línea)"
              className="w-full text-xs p-3 max-h-32 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white resize-none placeholder:text-slate-400 transition-all"
              disabled={sending}
            />
          </div>

          <Button
            type="submit"
            disabled={sending || (!inputText.trim() && attachmentsList.length === 0)}
            className="h-10 px-4 bg-primary text-white font-semibold text-xs shrink-0 rounded-xl shadow-xs"
          >
            {sending ? "..." : "Enviar ➔"}
          </Button>
        </form>
      </div>

      {/* Modal para adjuntar enlace o archivo */}
      {showAttachmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📎</span> Adjuntar Archivo o Enlace
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre o descripción</label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="Ej: Boceto_v1.png o Enlace Drive"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL del archivo</label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAttachmentModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddAttachment}
                disabled={!attachmentUrl.trim()}
                className="text-xs bg-primary text-white"
              >
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
