// ==============================================================================
// Edge Function: create-payment-intent
// ==============================================================================
// Simula o inicia la captura de fondos para una orden en "esperando_pago".
//
// FLUJO ACTUAL (Fase 4 - Simulado):
// 1. Valida autenticación del cliente solicitante.
// 2. Ejecuta la función atómica PostgreSQL `process_simulated_escrow_payment`.
// 3. Retiene los fondos en la tabla `escrow_holds` y actualiza la orden a `en_progreso`.
//
// PUNTO DE CONEXIÓN FUTURA CON PASARELA REAL (ej. Stripe Connect):
// ```typescript
// import Stripe from "https://esm.sh/stripe@14.14.0";
// const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
//
// const paymentIntent = await stripe.paymentIntents.create({
//   amount: Math.round(order.price * 100), // centavos
//   currency: "usd",
//   customer: clientStripeCustomerId,
//   transfer_group: `order_${order.id}`,
//   metadata: { order_id: order.id, client_id: user.id }
// });
// return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }));
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

    const { orderId, paymentMethod = "tarjeta_simulada" } = await req.json();
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ejecución atómica del depósito en custodia
    const { data, error } = await supabase.rpc("process_simulated_escrow_payment", {
      p_order_id: orderId,
      p_payment_method: paymentMethod,
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
        message: "Fondos depositados y retenidos exitosamente en Escrow.",
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
