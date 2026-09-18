import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConversations } from "../../hooks/useConversations";
import { useChat } from "../../hooks/useChat";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { DashboardLayout } from "../../shared/components/DashboardLayout";

export default function MessagesPage() {
  const { id: routeConversationId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const {
    conversations,
    loading: loadingConversations,
  } = useConversations();

  // Si hay ID en la URL usamos ese, o null si estamos en /messages
  const activeConversationId = routeConversationId || (conversations.length > 0 && window.innerWidth >= 768 ? conversations[0].id : undefined);

  // Redirigir en desktop al primer chat si estamos en /messages sin ID
  useEffect(() => {
    if (!routeConversationId && conversations.length > 0 && window.innerWidth >= 768) {
      navigate(`/messages/${conversations[0].id}`, { replace: true });
    }
  }, [routeConversationId, conversations, navigate]);

  const {
    conversation,
    messages,
    loading: loadingChat,
    sending,
    sendMessage,
    messagesEndRef,
  } = useChat(activeConversationId);

  const handleSelectConversation = (selectedId: string) => {
    navigate(`/messages/${selectedId}`);
  };

  const handleBackToList = () => {
    navigate("/messages");
  };

  return (
    <DashboardLayout
      title="Mensajes y Chat"
      subtitle="Comunícate directamente con clientes y freelancers en tiempo real."
    >
      <div className="min-h-[500px] h-[calc(100vh-9rem)] sm:h-[calc(100vh-13rem)] bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs flex">
        {/* Sidebar: Lista de Conversaciones */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
            routeConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            loading={loadingConversations}
          />
        </div>

        {/* Ventana de Chat Activo */}
        <div
          className={`flex-1 h-full ${
            !routeConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatWindow
            conversation={conversation}
            messages={messages}
            loading={loadingChat}
            sending={sending}
            onSendMessage={sendMessage}
            messagesEndRef={messagesEndRef}
            onBackToList={handleBackToList}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
