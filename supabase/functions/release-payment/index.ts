// ==============================================================================
// Edge Function: release-payment
// ==============================================================================
// Libera los fondos retenidos en Escrow hacia el freelancer tras la aprobación del cliente.
//
// FLUJO ACTUAL (Fase 4 - Simulado):
// 1. Valida autenticación del cliente que aprueba la orden.
// 2. Ejecuta la función atómica PostgreSQL `release_escrow_payment`.
// 3. Marca la retención como liberada, descuenta la comisión de plataforma y registra el Payout.
//
// PUNTO DE CONEXIÓN FUTURA CON PASARELA REAL (ej. Stripe Connect):
// ```typescript
// import Stripe from "https://esm.sh/stripe@14.14.0";
// const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
//
// // Transferencia del monto neto a la cuenta conectada del Freelancer (Custom / Express)
// const transfer = await stripe.transfers.create({
//   amount: Math.round(escrowHold.net_amount * 100),
//   currency: "usd",
//   destination: freelancerStripeAccountId,
//   transfer_group: `order_${order.id}`,
//   metadata: { order_id: order.id, fee: escrowHold.platform_fee }
// });
// ```
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { orderId, comment } = await req.json();
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ejecución atómica de la liberación de custodia
    const { data, error } = await supabase.rpc("release_escrow_payment", {
      p_order_id: orderId,
      p_comment: comment || null,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Fondos liberados exitosamente al freelancer.",
        data,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
