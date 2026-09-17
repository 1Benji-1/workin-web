import React, { useState } from "react";
import type { ConversationWithDetails } from "@freelance/types";
import { formatMessageDate } from "@freelance/core";
import { useAuth } from "../../shared/context/AuthContext";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  activeId?: string;
  onSelectConversation: (conversationId: string) => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  loading = false,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = conversations.filter((c) => {
    const isClient = user?.id === c.clientId;
    const counterpart = isClient ? c.freelancer : c.client;
    const name = counterpart?.fullName?.toLowerCase() || "";
    const orderTitle = c.order?.title?.toLowerCase() || "";
    const query = searchTerm.toLowerCase().trim();
    return name.includes(query) || orderTitle.includes(query);
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Buscador de Chats */}
      <div className="p-3.5 border-b border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario o proyecto..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all placeholder:text-slate-400"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 text-xs gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Cargando conversaciones...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            {searchTerm ? "No se encontraron resultados." : "No tienes conversaciones activas."}
          </div>
        ) : (
          filtered.map((conv) => {
            const isClient = user?.id === conv.clientId;
            const counterpart = isClient ? conv.freelancer : conv.client;
            const isSelected = conv.id === activeId;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                  isSelected
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden font-bold text-slate-600 text-sm shrink-0 mt-0.5">
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

                {/* Contenido / Metadatos */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {counterpart?.fullName || "Usuario de WorkIn"}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatMessageDate(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  {/* Badge de Orden si está vinculada */}
                  {conv.order && (
                    <span className="inline-block max-w-[180px] truncate text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mb-1 border border-slate-200/60">
                      📋 {conv.order.title}
                    </span>
                  )}

                  {/* Extracto del último mensaje */}
                  <p className="text-xs text-slate-500 truncate leading-snug">
                    {conv.lastMessage || <span className="italic text-slate-400">Sin mensajes aún</span>}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
