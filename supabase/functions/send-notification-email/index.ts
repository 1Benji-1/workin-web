// ==============================================================================
// Edge Function: send-notification-email
// ==============================================================================
// Despacha o simula correos electrónicos transaccionales con plantilla responsive de WorkIn.
//
// FLUJO ACTUAL (Fase 8):
// 1. Valida cabeceras de autorización y payload (email, destinatario, título, mensaje, url).
// 2. Genera una plantilla HTML responsive con diseño oficial de WorkIn.
// 3. En entorno de desarrollo/demo: loguea la previsualización y confirma la entrega simulada.
// 4. En producción (cuando se configure RESEND_API_KEY): envía el correo vía Resend API.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationPayload {
  recipientEmail: string;
  recipientName?: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  type?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Falta cabecera de autorización" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario no autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: EmailNotificationPayload = await req.json();
    const { recipientEmail, recipientName, title, message, actionUrl, actionText, type } = body;

    if (!recipientEmail || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios (recipientEmail, title, message)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientDisplayName = recipientName || "Usuario de WorkIn";
    const appBaseUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
    const finalActionUrl = actionUrl?.startsWith("http") ? actionUrl : `${appBaseUrl}${actionUrl || "/notifications"}`;
    const buttonLabel = actionText || "Ver en WorkIn";

    // Plantilla HTML de correo responsive WorkIn
    const htmlEmail = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 24px; text-align: center; }
    .logo { color: #f59e0b; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; text-decoration: none; }
    .content { padding: 32px 24px; color: #334155; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 28px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { background: #f59e0b; color: #0f172a; padding: 14px 28px; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">⚡ WorkIn</span>
    </div>
    <div class="content">
      <div class="greeting">Hola, ${recipientDisplayName}</div>
      <h2 class="title">${title}</h2>
      <p class="text">${message}</p>
      <div class="btn-container">
        <a href="${finalActionUrl}" class="btn" target="_blank">${buttonLabel}</a>
      </div>
    </div>
    <div class="footer">
      <p>Has recibido este correo porque tienes una cuenta activa en WorkIn.</p>
      <p>© ${new Date().getFullYear()} WorkIn Platform — Pagos protegidos en Escrow para freelancers y clientes.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Verificación de integración con proveedor real (Resend API)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "WorkIn <notificaciones@workin.app>",
          to: [recipientEmail],
          subject: title,
          html: htmlEmail,
        }),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.error("Error enviando email vía Resend:", errText);
        return new Response(
          JSON.stringify({ error: "Fallo al despachar email", details: errText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resendData = await resendRes.json();
      return new Response(
        JSON.stringify({ success: true, messageId: resendData.id, provider: "resend" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Modo simulado / desarrollo con preview formateada
    const simulatedMessageId = `sim_msg_${crypto.randomUUID()}`;
    console.log("=================================================");
    console.log("📧 [SIMULATED EMAIL NOTIFICATION DISPATCHED]");
    console.log(`To: ${recipientDisplayName} <${recipientEmail}>`);
    console.log(`Subject: ${title}`);
    console.log(`Type: ${type || "general"}`);
    console.log(`Message: ${message}`);
    console.log(`Action Link: ${finalActionUrl}`);
    console.log(`ID: ${simulatedMessageId}`);
    console.log("=================================================");

    return new Response(
      JSON.stringify({
        success: true,
        simulated: true,
        messageId: simulatedMessageId,
        recipient: recipientEmail,
        title,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
