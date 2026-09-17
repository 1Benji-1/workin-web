import React from "react";
import { useNavigate } from "react-router-dom";
import type { Notification } from "@freelance/types";
import {
  getNotificationVisualConfig,
  formatNotificationTime,
  getNotificationActionUrl,
} from "@freelance/core";

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({
  notification,
  onRead,
  onClose,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const visual = getNotificationVisualConfig(notification.type);
  const timeFormatted = formatNotificationTime(notification.createdAt);

  const handleClick = () => {
    if (!notification.isRead && onRead) {
      onRead(notification.id);
    }
    const targetUrl = getNotificationActionUrl(
      notification.type,
      notification.data as Record<string, unknown>
    );
    if (onClose) {
      onClose();
    }
    navigate(targetUrl);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative flex items-start gap-3 p-3.5 transition-all text-left cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80 ${
        !notification.isRead ? "bg-amber-50/20" : "bg-white"
      }`}
    >
      {/* Indicador visual de no leído */}
      {!notification.isRead && (
        <span
          className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20"
          title="No leído"
        />
      )}

      {/* Ícono de la categoría */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base border shadow-sm ${visual.bgClass}`}
      >
        <span>{visual.icon}</span>
      </div>

      {/* Contenido textual */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p
            className={`text-xs font-semibold truncate ${
              !notification.isRead ? "text-slate-900 font-bold" : "text-slate-700"
            }`}
          >
            {notification.title}
          </p>
          <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
            {timeFormatted}
          </span>
        </div>

        <p
          className={`text-xs line-clamp-2 leading-relaxed ${
            !notification.isRead ? "text-slate-800" : "text-slate-500"
          }`}
        >
          {notification.message}
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {visual.label}
          </span>
          <span className="text-[10px] text-primary group-hover:underline font-medium">
            Ver detalles →
          </span>
        </div>
      </div>
    </div>
  );
}
