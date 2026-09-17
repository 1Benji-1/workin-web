-- ============================================================
-- FASE 11 — PRUEBAS DE RESISTENCIA DEL FLUJO DE PAGOS Y ESCROW
-- ============================================================
-- Verifica casos límite, concurrencia simulada, reintentos y
-- protecciones atómicas de las funciones SECURITY DEFINER de Escrow.
-- ============================================================

\set ON_ERROR_STOP off
\set QUIET on

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '  STRESS TEST DE ESCROW Y PAGOS — WorkIn Platform';
    RAISE NOTICE '  Fecha: %', now();
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Funciones auxiliares de reporte
CREATE OR REPLACE FUNCTION _escrow_assert(test_name TEXT, success BOOLEAN, detail TEXT DEFAULT '')
RETURNS VOID AS $$
BEGIN
    IF success THEN
        RAISE NOTICE '  ✅ PASS: % %', test_name, CASE WHEN detail <> '' THEN '(' || detail || ')' ELSE '' END;
    ELSE
        RAISE NOTICE '  ❌ FAIL: % %', test_name, CASE WHEN detail <> '' THEN '(' || detail || ')' ELSE '' END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Setup inicial de usuarios (pre-cleanup para asegurar idempotencia)
BEGIN;
DELETE FROM public.dispute_resolutions WHERE dispute_id IN (SELECT id FROM public.disputes WHERE order_id::text LIKE '%-eeee-%');
DELETE FROM public.dispute_messages WHERE dispute_id IN (SELECT id FROM public.disputes WHERE order_id::text LIKE '%-eeee-%');
DELETE FROM public.disputes WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.notifications WHERE data->>'order_id' LIKE '%-eeee-%';
DELETE FROM public.platform_fees WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.payouts WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.escrow_holds WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.payments WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.order_status_history WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.orders WHERE id::text LIKE '%-eeee-%';
DELETE FROM public.user_roles WHERE user_id IN ('eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003');
DELETE FROM public.profiles WHERE id IN ('eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003');
DELETE FROM auth.users WHERE id IN ('eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, instance_id, aud, role, created_at, updated_at)
VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', 'stress_client@workin.test', crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name": "Stress Cliente"}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    ('eeeeeeee-0000-0000-0000-000000000002', 'stress_freelancer@workin.test', crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name": "Stress Freelancer"}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    ('eeeeeeee-0000-0000-0000-000000000003', 'stress_intruder@workin.test', crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name": "Stress Intruder"}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, active)
VALUES ('eeeeeeee-0000-0000-0000-000000000002', 'freelancer', true)
ON CONFLICT (user_id, role) DO UPDATE SET active = true;

COMMIT;

-- ============================================================
-- 1. CASOS LÍMITE: process_simulated_escrow_payment
-- ============================================================
DO $$
DECLARE
    v_order_id UUID := '11111111-eeee-0000-0000-000000000001';
    v_client_id UUID := 'eeeeeeee-0000-0000-0000-000000000001';
    v_freelancer_id UUID := 'eeeeeeee-0000-0000-0000-000000000002';
    v_intruder_id UUID := 'eeeeeeee-0000-0000-0000-000000000003';
    v_result JSONB;
    v_err_caught BOOLEAN;
    v_escrow_count INTEGER;
    v_fee NUMERIC;
    v_net NUMERIC;
BEGIN
    RAISE NOTICE '── 1. process_simulated_escrow_payment ───────────────────────';

    -- Crear orden de prueba en estado 'esperando_pago' con precio $1000.00
    INSERT INTO public.orders (id, client_id, freelancer_id, title, description, price, delivery_days, status)
    VALUES (v_order_id, v_client_id, v_freelancer_id, 'Orden Stress 1', 'Test', 1000.00, 5, 'esperando_pago')
    ON CONFLICT (id) DO UPDATE SET status = 'esperando_pago', price = 1000.00;

    -- Test 1.1: Pago rechazado si invocador es un intruso
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000003","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.process_simulated_escrow_payment(v_order_id);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Pago rechazado a usuario no-cliente', v_err_caught);

    -- Test 1.2: Pago rechazado si orden no existe
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.process_simulated_escrow_payment('00000000-dead-beef-0000-000000000000');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Pago rechazado en orden inexistente', v_err_caught);

    -- Test 1.3: Pago exitoso por el cliente legítimo
    v_err_caught := false;
    BEGIN
        v_result := public.process_simulated_escrow_payment(v_order_id);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Pago legítimo exitoso', NOT v_err_caught);

    -- Verificar cálculos financieros (10% fee = 100, net = 900)
    SELECT platform_fee, net_amount INTO v_fee, v_net FROM public.escrow_holds WHERE order_id = v_order_id;
    PERFORM _escrow_assert('Cálculo de comisión exacto (10% = $100.00)', v_fee = 100.00, 'fee=' || v_fee);
    PERFORM _escrow_assert('Cálculo monto neto exacto (90% = $900.00)', v_net = 900.00, 'net=' || v_net);

    -- Test 1.4: DOBLE PAGO (Reintentos / Doble Clic) -> Debe ser rechazado
    v_err_caught := false;
    BEGIN
        PERFORM public.process_simulated_escrow_payment(v_order_id);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Doble pago bloqueado (prevención de double-charge)', v_err_caught);

    -- Verificar que solo existe UN escrow_hold
    SELECT count(*) INTO v_escrow_count FROM public.escrow_holds WHERE order_id = v_order_id;
    PERFORM _escrow_assert('Exactamente 1 retención creada tras reintento', v_escrow_count = 1);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 2. CASOS LÍMITE: release_escrow_payment
-- ============================================================
DO $$
DECLARE
    v_order_id UUID := '11111111-eeee-0000-0000-000000000001';
    v_client_id UUID := 'eeeeeeee-0000-0000-0000-000000000001';
    v_freelancer_id UUID := 'eeeeeeee-0000-0000-0000-000000000002';
    v_err_caught BOOLEAN;
    v_payout_amount NUMERIC;
    v_payout_status TEXT;
    v_escrow_status TEXT;
    v_order_status TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 2. release_escrow_payment ─────────────────────────────────';

    -- Test 2.1: Liberación rechazada si la orden aún está 'en_progreso' (no entregada)
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.release_escrow_payment(v_order_id);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Liberación rechazada si orden no ha sido entregada', v_err_caught);

    -- Marcar la orden como 'entregado'
    UPDATE public.orders SET status = 'entregado', delivered_at = now() WHERE id = v_order_id;

    -- Test 2.2: Liberación rechazada si quien intenta liberar es el freelancer
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000002","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.release_escrow_payment(v_order_id);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Liberación rechazada si quien invoca es el freelancer', v_err_caught);

    -- Test 2.3: Liberación exitosa por el cliente
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.release_escrow_payment(v_order_id, 'Trabajo excelente, aprobado');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Liberación legítima completada', NOT v_err_caught);

    -- Verificar estados pos-liberación
    SELECT status INTO v_escrow_status FROM public.escrow_holds WHERE order_id = v_order_id;
    SELECT status INTO v_order_status FROM public.orders WHERE id = v_order_id;
    SELECT amount, status INTO v_payout_amount, v_payout_status FROM public.payouts WHERE order_id = v_order_id;

    PERFORM _escrow_assert('Estado escrow actualizado a released', v_escrow_status = 'released');
    PERFORM _escrow_assert('Estado orden actualizado a aprobado', v_order_status = 'aprobado');
    PERFORM _escrow_assert('Payout generado al freelancer por $900.00', v_payout_amount = 900.00 AND v_payout_status = 'completed');

    -- Test 2.4: DOBLE LIBERACIÓN (Doble Clic en botón "Aprobar y Liberar")
    v_err_caught := false;
    BEGIN
        PERFORM public.release_escrow_payment(v_order_id);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Doble liberación bloqueada (prevención de double-payout)', v_err_caught);

    -- Verificar que NO se generó un segundo payout
    DECLARE
        v_payout_count INTEGER;
    BEGIN
        SELECT count(*) INTO v_payout_count FROM public.payouts WHERE order_id = v_order_id;
        PERFORM _escrow_assert('Solo existe 1 payout registrado tras doble intento', v_payout_count = 1);
    END;

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 3. CASOS LÍMITE: partial_release_escrow_payment
-- ============================================================
DO $$
DECLARE
    v_order_id UUID := '22222222-eeee-0000-0000-000000000002';
    v_client_id UUID := 'eeeeeeee-0000-0000-0000-000000000001';
    v_freelancer_id UUID := 'eeeeeeee-0000-0000-0000-000000000002';
    v_err_caught BOOLEAN;
    v_payout_amount NUMERIC;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 3. partial_release_escrow_payment ─────────────────────────';

    -- Crear segunda orden y su pago
    INSERT INTO public.orders (id, client_id, freelancer_id, title, description, price, delivery_days, status)
    VALUES (v_order_id, v_client_id, v_freelancer_id, 'Orden Partial 1', 'Test', 1000.00, 5, 'esperando_pago')
    ON CONFLICT (id) DO UPDATE SET status = 'esperando_pago', price = 1000.00;

    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
    PERFORM public.process_simulated_escrow_payment(v_order_id);

    -- Test 3.1: Porcentaje negativo rechazado
    v_err_caught := false;
    BEGIN
        PERFORM public.partial_release_escrow_payment(v_order_id, -10.00, 'Negativo');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Porcentaje negativo rechazado (< 0)', v_err_caught);

    -- Test 3.2: Porcentaje mayor a 100 rechazado
    v_err_caught := false;
    BEGIN
        PERFORM public.partial_release_escrow_payment(v_order_id, 150.00, 'Mayor a 100');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Porcentaje > 100 rechazado', v_err_caught);

    -- Test 3.3: Liberación parcial al 40% ($900 net * 40% = $360.00)
    v_err_caught := false;
    BEGIN
        PERFORM public.partial_release_escrow_payment(v_order_id, 40.00, 'Acuerdo mutuo 40%');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Liberación parcial 40% ejecutada', NOT v_err_caught);

    SELECT amount INTO v_payout_amount FROM public.payouts WHERE order_id = v_order_id;
    PERFORM _escrow_assert('Payout al freelancer exactamente $360.00 (40% de $900)', v_payout_amount = 360.00, 'amount=' || v_payout_amount);

    -- Test 3.4: Reintento sobre escrow ya parcialmente liberado -> Bloqueado
    v_err_caught := false;
    BEGIN
        PERFORM public.partial_release_escrow_payment(v_order_id, 60.00, 'Segundo intento');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Re-liberación sobre escrow cerrado bloqueada', v_err_caught);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 4. CASOS LÍMITE: open_order_dispute
-- ============================================================
DO $$
DECLARE
    v_order_id UUID := '33333333-eeee-0000-0000-000000000003';
    v_client_id UUID := 'eeeeeeee-0000-0000-0000-000000000001';
    v_freelancer_id UUID := 'eeeeeeee-0000-0000-0000-000000000002';
    v_intruder_id UUID := 'eeeeeeee-0000-0000-0000-000000000003';
    v_err_caught BOOLEAN;
    v_dispute_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 4. open_order_dispute ─────────────────────────────────────';

    -- Crear orden en 'esperando_pago'
    INSERT INTO public.orders (id, client_id, freelancer_id, title, description, price, delivery_days, status)
    VALUES (v_order_id, v_client_id, v_freelancer_id, 'Orden Disputa 1', 'Test', 500.00, 3, 'esperando_pago')
    ON CONFLICT (id) DO UPDATE SET status = 'esperando_pago', price = 500.00;

    -- Test 4.1: Disputa rechazada en orden sin pago (esperando_pago)
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.open_order_dispute(v_order_id, 'No me gusta', 'Detalle');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Disputa rechazada en orden esperando_pago', v_err_caught);

    -- Pagar la orden para pasarla a 'en_progreso'
    PERFORM public.process_simulated_escrow_payment(v_order_id);

    -- Test 4.2: Disputa rechazada si quien la abre no es parte de la orden
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000003","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.open_order_dispute(v_order_id, 'Intruso', 'Detalle');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Disputa rechazada a usuario ajeno a la orden', v_err_caught);

    -- Test 4.3: Apertura legítima de disputa por el cliente
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.open_order_dispute(v_order_id, 'Incumplimiento de plazos', 'El freelancer no responde');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Disputa abierta exitosamente por el cliente', NOT v_err_caught);

    -- Test 4.4: Intento de abrir SEGUNDA disputa en orden ya en disputa -> Bloqueado
    v_err_caught := false;
    BEGIN
        PERFORM public.open_order_dispute(v_order_id, 'Segunda disputa', 'Detalle');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Segunda disputa concurrente bloqueada', v_err_caught);

    SELECT count(*) INTO v_dispute_count FROM public.disputes WHERE order_id = v_order_id AND status = 'open';
    PERFORM _escrow_assert('Exactamente 1 disputa abierta registrada', v_dispute_count = 1);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 5. CASOS LÍMITE: resolve_order_dispute (3 Veredictos)
-- ============================================================
DO $$
DECLARE
    v_order_id UUID := '33333333-eeee-0000-0000-000000000003';
    v_dispute_id UUID;
    v_err_caught BOOLEAN;
    v_escrow_status TEXT;
    v_order_status TEXT;
    v_dispute_status TEXT;
    v_resolution_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 5. resolve_order_dispute ──────────────────────────────────';

    SELECT id INTO v_dispute_id FROM public.disputes WHERE order_id = v_order_id;

    -- Test 5.1: Decisión inválida rechazada
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
    v_err_caught := false;
    BEGIN
        PERFORM public.resolve_order_dispute(v_dispute_id, 'decision_falsa', 50, 'Nota');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Decisión inválida rechazada', v_err_caught);

    -- Test 5.2: Veredicto 'no_liberar' (Reembolso completo al cliente)
    v_err_caught := false;
    BEGIN
        PERFORM public.resolve_order_dispute(v_dispute_id, 'no_liberar', 0.00, 'Incumplimiento total comprobado');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Veredicto no_liberar ejecutado', NOT v_err_caught);

    SELECT status INTO v_escrow_status FROM public.escrow_holds WHERE order_id = v_order_id;
    SELECT status INTO v_order_status FROM public.orders WHERE id = v_order_id;
    SELECT status INTO v_dispute_status FROM public.disputes WHERE id = v_dispute_id;

    PERFORM _escrow_assert('Escrow marcado como refunded', v_escrow_status = 'refunded');
    PERFORM _escrow_assert('Orden marcada como cerrada', v_order_status = 'cerrado');
    PERFORM _escrow_assert('Disputa marcada como resolved', v_dispute_status = 'resolved');

    -- Test 5.3: Re-resolución de disputa ya resuelta -> Bloqueada
    v_err_caught := false;
    BEGIN
        PERFORM public.resolve_order_dispute(v_dispute_id, 'liberar_completo', 100, 'Cambio de opinión');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := true;
    END;
    PERFORM _escrow_assert('Re-resolución de disputa ya resuelta bloqueada', v_err_caught);

    SELECT count(*) INTO v_resolution_count FROM public.dispute_resolutions WHERE dispute_id = v_dispute_id;
    PERFORM _escrow_assert('Registro inmutable de resolución único (count=1)', v_resolution_count = 1);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- CLEANUP
-- ============================================================
BEGIN;
DELETE FROM public.dispute_resolutions WHERE dispute_id IN (SELECT id FROM public.disputes WHERE order_id::text LIKE '33333333-eeee%');
DELETE FROM public.dispute_messages WHERE dispute_id IN (SELECT id FROM public.disputes WHERE order_id::text LIKE '33333333-eeee%');
DELETE FROM public.disputes WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.notifications WHERE data->>'order_id' LIKE '%-eeee-%';
DELETE FROM public.platform_fees WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.payouts WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.escrow_holds WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.payments WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.order_status_history WHERE order_id::text LIKE '%-eeee-%';
DELETE FROM public.orders WHERE id::text LIKE '%-eeee-%';
DELETE FROM public.user_roles WHERE user_id IN ('eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003');
DELETE FROM public.profiles WHERE id IN ('eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003');
DELETE FROM auth.users WHERE id IN ('eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003');

DROP FUNCTION IF EXISTS _escrow_assert(TEXT, BOOLEAN, TEXT);
COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '  STRESS TEST DE ESCROW FINALIZADO';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;
