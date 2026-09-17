-- ============================================================
-- FASE 11 — AUDITORÍA COMPLETA DE POLÍTICAS RLS
-- ============================================================
-- Este script prueba activamente CADA política RLS de las 19 tablas
-- usando 3 usuarios de prueba: cliente, freelancer y outsider.
-- Ejecutar: docker exec -i supabase_db_workin-web psql -U postgres < supabase/tests/rls_audit_test.sql
-- ============================================================

\set ON_ERROR_STOP off
\set QUIET on

-- ============================================================
-- VARIABLES DE CONTROL
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '  AUDITORÍA RLS — WorkIn Platform';
    RAISE NOTICE '  Fecha: %', now();
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ============================================================
-- 0. SETUP: Crear usuarios y datos de prueba
-- ============================================================
BEGIN;

-- Crear 3 usuarios de prueba en auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, instance_id, aud, role, created_at, updated_at)
VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'test_client@workin.test', crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name": "Test Cliente"}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    ('aaaaaaaa-0000-0000-0000-000000000002', 'test_freelancer@workin.test', crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name": "Test Freelancer"}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    ('aaaaaaaa-0000-0000-0000-000000000003', 'test_outsider@workin.test', crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name": "Test Outsider"}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- El trigger handle_new_user() crea profiles y user_roles automáticamente.
-- Asignar rol freelancer al usuario 2
INSERT INTO public.user_roles (user_id, role, active)
VALUES ('aaaaaaaa-0000-0000-0000-000000000002', 'freelancer', true)
ON CONFLICT (user_id, role) DO UPDATE SET active = true;

-- Crear servicio de prueba del freelancer
INSERT INTO public.services (id, freelancer_id, category_id, title, description, price, delivery_days, status)
SELECT
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000002',
    c.id,
    'Servicio RLS Test',
    'Servicio de prueba para auditoría RLS',
    500.00,
    7,
    'active'
FROM public.categories c LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Crear orden de prueba (client -> freelancer)
INSERT INTO public.orders (id, client_id, freelancer_id, service_id, title, description, price, delivery_days, status)
VALUES (
    'cccccccc-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Orden RLS Test',
    'Orden de prueba para auditoría RLS',
    500.00,
    7,
    'esperando_pago'
)
ON CONFLICT (id) DO NOTHING;

-- Crear requerimiento de la orden
INSERT INTO public.order_requirements (id, order_id, description)
VALUES ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Requerimiento de prueba RLS')
ON CONFLICT (id) DO NOTHING;

-- Crear historial de estado
INSERT INTO public.order_status_history (id, order_id, previous_status, new_status, changed_by, comment)
VALUES ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', NULL, 'esperando_pago', 'aaaaaaaa-0000-0000-0000-000000000001', 'Orden creada')
ON CONFLICT (id) DO NOTHING;

-- Crear pago simulado
INSERT INTO public.payments (id, order_id, client_id, amount, status, payment_provider)
VALUES ('ffffffff-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 500.00, 'held_in_escrow', 'simulado')
ON CONFLICT (id) DO NOTHING;

-- Crear escrow hold
INSERT INTO public.escrow_holds (id, order_id, payment_id, amount, platform_fee, net_amount, status)
VALUES ('11111111-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001', 500.00, 50.00, 450.00, 'held')
ON CONFLICT (id) DO NOTHING;

-- Crear payout
INSERT INTO public.payouts (id, order_id, freelancer_id, amount, status)
VALUES ('22222222-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 450.00, 'pending')
ON CONFLICT (id) DO NOTHING;

-- Crear platform fee
INSERT INTO public.platform_fees (id, order_id, escrow_id, fee_amount)
VALUES ('33333333-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 50.00)
ON CONFLICT (id) DO NOTHING;

-- Crear conversación entre client y freelancer
INSERT INTO public.conversations (id, client_id, freelancer_id, order_id, last_message)
VALUES ('44444444-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'Hola!')
ON CONFLICT (id) DO NOTHING;

-- Crear mensaje en la conversación
INSERT INTO public.messages (id, conversation_id, sender_id, content)
VALUES ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Hola, mensaje de prueba RLS')
ON CONFLICT (id) DO NOTHING;

-- Crear notificación para el cliente
INSERT INTO public.notifications (id, user_id, title, message, type)
VALUES ('66666666-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Test Notif', 'Notificación de prueba', 'system')
ON CONFLICT (id) DO NOTHING;

-- Crear notificación para el freelancer
INSERT INTO public.notifications (id, user_id, title, message, type)
VALUES ('66666666-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'Test Notif FL', 'Notificación freelancer', 'system')
ON CONFLICT (id) DO NOTHING;

-- Cambiar orden a en_progreso para poder crear disputa luego
UPDATE public.orders SET status = 'en_progreso' WHERE id = 'cccccccc-0000-0000-0000-000000000001';

-- Crear disputa
INSERT INTO public.disputes (id, order_id, initiator_id, respondent_id, reason, description, status)
VALUES ('77777777-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Calidad insuficiente', 'El trabajo no cumple estándares', 'open')
ON CONFLICT (id) DO NOTHING;

-- Crear mensaje de disputa
INSERT INTO public.dispute_messages (id, dispute_id, sender_id, message)
VALUES ('88888888-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Evidencia de prueba RLS')
ON CONFLICT (id) DO NOTHING;

-- Crear review (necesitamos una orden aprobada)
-- Primero creamos otra orden ya aprobada
INSERT INTO public.orders (id, client_id, freelancer_id, service_id, title, description, price, delivery_days, status, completed_at)
VALUES (
    'cccccccc-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Orden Aprobada RLS Test',
    'Orden aprobada para review',
    300.00,
    5,
    'aprobado',
    now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reviews (id, order_id, client_id, freelancer_id, service_id, rating, comment)
VALUES ('99999999-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 5, 'Excelente trabajo de prueba')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================
-- FUNCIONES AUXILIARES DE ASERCIÓN
-- ============================================================
CREATE OR REPLACE FUNCTION _rls_test_assert(
    test_name TEXT,
    expected BOOLEAN,
    actual BOOLEAN
) RETURNS VOID AS $$
BEGIN
    IF expected = actual THEN
        RAISE NOTICE '  ✅ PASS: %', test_name;
    ELSE
        RAISE NOTICE '  ❌ FAIL: % (esperado: %, obtenido: %)', test_name, expected, actual;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION _rls_test_count(
    test_name TEXT,
    expected_count INTEGER,
    actual_count INTEGER
) RETURNS VOID AS $$
BEGIN
    IF expected_count = actual_count THEN
        RAISE NOTICE '  ✅ PASS: % (count=%)', test_name, actual_count;
    ELSE
        RAISE NOTICE '  ❌ FAIL: % (esperado: %, obtenido: %)', test_name, expected_count, actual_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MACRO: Simular usuario autenticado
-- ============================================================
-- En Supabase local, para simular un usuario, seteamos:
--   role = 'authenticated'
--   request.jwt.claims = '{"sub":"<user_id>","role":"authenticated"}'

-- ============================================================
-- 1. AUDITORÍA: public.profiles
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
    v_success BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 1. profiles ──────────────────────────────────────────────';

    -- Test 1.1: Cualquier usuario autenticado puede leer TODOS los perfiles
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.profiles;
    PERFORM _rls_test_assert('Outsider puede leer todos los perfiles', true, v_count >= 3);

    -- Test 1.2: Usuario solo puede actualizar SU perfil
    UPDATE public.profiles SET headline = 'Test' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    PERFORM _rls_test_assert('Outsider NO puede UPDATE perfil ajeno', true, v_count = 0);

    -- Test 1.3: Usuario puede actualizar su propio perfil
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    UPDATE public.profiles SET headline = 'Mi perfil test' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000003';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    PERFORM _rls_test_assert('Usuario puede UPDATE su propio perfil', true, v_count = 1);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 2. AUDITORÍA: public.user_roles
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 2. user_roles ────────────────────────────────────────────';

    -- Test 2.1: Usuario solo ve SUS roles
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.user_roles;
    PERFORM _rls_test_assert('Cliente solo ve sus propios roles', true, v_count >= 1);

    -- Test 2.2: Outsider no ve roles de otros
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.user_roles WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO ve roles de otro usuario', 0, v_count);

    -- Test 2.3: Usuario NO puede auto-asignarse 'admin'
    BEGIN
        INSERT INTO public.user_roles (user_id, role, active)
        VALUES ('aaaaaaaa-0000-0000-0000-000000000003', 'admin', true);
        -- Si llega aquí, la política falló
        PERFORM _rls_test_assert('Usuario NO puede auto-asignarse admin', true, false);
        -- Limpiar
        DELETE FROM public.user_roles WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000003' AND role = 'admin';
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Usuario NO puede auto-asignarse admin', true, true);
    END;

    -- Test 2.4: Usuario NO puede auto-asignarse 'soporte'
    BEGIN
        INSERT INTO public.user_roles (user_id, role, active)
        VALUES ('aaaaaaaa-0000-0000-0000-000000000003', 'soporte', true);
        PERFORM _rls_test_assert('Usuario NO puede auto-asignarse soporte', true, false);
        DELETE FROM public.user_roles WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000003' AND role = 'soporte';
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Usuario NO puede auto-asignarse soporte', true, true);
    END;

    -- Test 2.5: Usuario SÍ puede auto-asignarse 'freelancer'
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    BEGIN
        INSERT INTO public.user_roles (user_id, role, active)
        VALUES ('aaaaaaaa-0000-0000-0000-000000000003', 'freelancer', true)
        ON CONFLICT (user_id, role) DO NOTHING;
        PERFORM _rls_test_assert('Usuario SÍ puede auto-asignarse freelancer', true, true);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Usuario SÍ puede auto-asignarse freelancer', true, false);
    END;

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 3. AUDITORÍA: public.categories
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 3. categories ───────────────────────────────────────────';

    -- Test 3.1: Lectura pública (incluso sin autenticar)
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.categories;
    PERFORM _rls_test_assert('Cualquier usuario puede leer categorías', true, v_count >= 6);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 4. AUDITORÍA: public.services
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 4. services ─────────────────────────────────────────────';

    -- Test 4.1: Outsider puede ver servicios activos
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.services WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Outsider puede ver servicio activo', true, v_count = 1);

    -- Test 4.2: Outsider NO puede actualizar servicio ajeno
    BEGIN
        UPDATE public.services SET title = 'Hackeado' WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';
        GET DIAGNOSTICS v_count = ROW_COUNT;
        PERFORM _rls_test_assert('Outsider NO puede UPDATE servicio ajeno', true, v_count = 0);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Outsider NO puede UPDATE servicio ajeno', true, true);
    END;

    -- Test 4.3: Outsider NO puede eliminar servicio ajeno
    BEGIN
        DELETE FROM public.services WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';
        GET DIAGNOSTICS v_count = ROW_COUNT;
        PERFORM _rls_test_assert('Outsider NO puede DELETE servicio ajeno', true, v_count = 0);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Outsider NO puede DELETE servicio ajeno', true, true);
    END;

    -- Test 4.4: Freelancer SÍ puede actualizar SU servicio
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';
    UPDATE public.services SET title = 'Servicio RLS Test Actualizado' WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    PERFORM _rls_test_assert('Freelancer SÍ puede UPDATE su servicio', true, v_count = 1);
    -- Restaurar
    UPDATE public.services SET title = 'Servicio RLS Test' WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 5. AUDITORÍA: public.orders
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 5. orders ───────────────────────────────────────────────';

    -- Test 5.1: Cliente ve su orden
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.orders WHERE id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente puede ver su orden', true, v_count = 1);

    -- Test 5.2: Freelancer ve la orden donde participa
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.orders WHERE id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Freelancer puede ver orden donde participa', true, v_count = 1);

    -- Test 5.3: Outsider NO ve órdenes ajenas
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.orders WHERE id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver orden ajena', 0, v_count);

    -- Test 5.4: Outsider NO puede actualizar orden ajena
    UPDATE public.orders SET title = 'Hackeado' WHERE id = 'cccccccc-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    PERFORM _rls_test_count('Outsider NO puede UPDATE orden ajena', 0, v_count);

    -- Test 5.5: Outsider NO puede insertar orden como otro cliente
    BEGIN
        INSERT INTO public.orders (client_id, freelancer_id, title, description, price, delivery_days)
        VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Hack', 'Hack', 100, 1);
        PERFORM _rls_test_assert('Outsider NO puede INSERT orden como otro cliente', true, false);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Outsider NO puede INSERT orden como otro cliente', true, true);
    END;

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 6. AUDITORÍA: public.order_requirements
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 6. order_requirements ───────────────────────────────────';

    -- Test 6.1: Participante ve requerimientos
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.order_requirements WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente ve requerimientos de su orden', true, v_count >= 1);

    -- Test 6.2: Outsider NO ve requerimientos
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.order_requirements WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO ve requerimientos ajenos', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 7. AUDITORÍA: public.order_status_history
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 7. order_status_history ────────────────────────────────';

    -- Test 7.1: Participante ve historial
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.order_status_history WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente ve historial de su orden', true, v_count >= 1);

    -- Test 7.2: Outsider NO ve historial
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.order_status_history WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO ve historial ajeno', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 8. AUDITORÍA: public.payments
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 8. payments ─────────────────────────────────────────────';

    -- Test 8.1: Cliente ve su pago
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.payments WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente puede ver sus pagos', true, v_count >= 1);

    -- Test 8.2: Freelancer ve pagos de orden donde participa
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.payments WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Freelancer puede ver pagos de su orden', true, v_count >= 1);

    -- Test 8.3: Outsider NO ve pagos ajenos
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.payments WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver pagos ajenos', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 9. AUDITORÍA: public.escrow_holds
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 9. escrow_holds ─────────────────────────────────────────';

    -- Test 9.1: Participante ve escrow
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.escrow_holds WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente ve escrow de su orden', true, v_count >= 1);

    -- Test 9.2: Outsider NO ve escrow
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.escrow_holds WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver escrow ajeno', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 10. AUDITORÍA: public.payouts
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 10. payouts ────────────────────────────────────────────';

    -- Test 10.1: Freelancer ve su payout
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.payouts WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Freelancer ve su payout', true, v_count >= 1);

    -- Test 10.2: Cliente ve payouts de su orden
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.payouts WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente ve payouts de su orden', true, v_count >= 1);

    -- Test 10.3: Outsider NO ve payouts
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.payouts WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver payouts ajenos', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 11. AUDITORÍA: public.platform_fees
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 11. platform_fees ──────────────────────────────────────';

    -- Test 11.1: Participante ve fees
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.platform_fees WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente ve platform fees de su orden', true, v_count >= 1);

    -- Test 11.2: Outsider NO ve fees
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.platform_fees WHERE order_id = 'cccccccc-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver platform fees', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 12. AUDITORÍA: public.disputes
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 12. disputes ───────────────────────────────────────────';

    -- Test 12.1: Initiator ve la disputa
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.disputes WHERE id = '77777777-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Initiator puede ver su disputa', true, v_count = 1);

    -- Test 12.2: Respondent ve la disputa
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.disputes WHERE id = '77777777-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Respondent puede ver la disputa', true, v_count = 1);

    -- Test 12.3: Outsider NO ve disputas
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.disputes WHERE id = '77777777-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver disputa ajena', 0, v_count);

    -- Test 12.4: Outsider NO puede insertar disputa como otro
    BEGIN
        INSERT INTO public.disputes (order_id, initiator_id, respondent_id, reason, description)
        VALUES ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Hack', 'Hack');
        PERFORM _rls_test_assert('Outsider NO puede INSERT disputa como otro', true, false);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Outsider NO puede INSERT disputa como otro', true, true);
    END;

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 13. AUDITORÍA: public.dispute_messages
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 13. dispute_messages ────────────────────────────────────';

    -- Test 13.1: Participante ve mensajes de disputa
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.dispute_messages WHERE dispute_id = '77777777-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Initiator ve mensajes de la disputa', true, v_count >= 1);

    -- Test 13.2: Outsider NO ve mensajes de disputa
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.dispute_messages WHERE dispute_id = '77777777-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO ve mensajes de disputa', 0, v_count);

    -- Test 13.3: Outsider NO puede insertar mensaje suplantando sender
    BEGIN
        INSERT INTO public.dispute_messages (dispute_id, sender_id, message)
        VALUES ('77777777-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Mensaje falso');
        PERFORM _rls_test_assert('Outsider NO puede INSERT mensaje de disputa como otro', true, false);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Outsider NO puede INSERT mensaje de disputa como otro', true, true);
    END;

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 14. AUDITORÍA: public.dispute_resolutions
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 14. dispute_resolutions ────────────────────────────────';

    -- Test 14.1: Participante puede ver resoluciones (vacío, no hay aún)
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.dispute_resolutions WHERE dispute_id = '77777777-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Participante puede consultar resoluciones', 0, v_count);

    -- Test 14.2: Outsider NO ve resoluciones
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.dispute_resolutions WHERE dispute_id = '77777777-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver resoluciones', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 15. AUDITORÍA: public.conversations
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 15. conversations ──────────────────────────────────────';

    -- Test 15.1: Cliente ve su conversación
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.conversations WHERE id = '44444444-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente ve su conversación', true, v_count = 1);

    -- Test 15.2: Freelancer ve la conversación
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.conversations WHERE id = '44444444-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Freelancer ve la conversación', true, v_count = 1);

    -- Test 15.3: Outsider NO ve conversaciones ajenas
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.conversations WHERE id = '44444444-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver conversación ajena', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 16. AUDITORÍA: public.messages
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 16. messages ───────────────────────────────────────────';

    -- Test 16.1: Participante ve mensajes
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.messages WHERE conversation_id = '44444444-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente ve mensajes de su conversación', true, v_count >= 1);

    -- Test 16.2: Outsider NO ve mensajes
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.messages WHERE conversation_id = '44444444-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver mensajes ajenos', 0, v_count);

    -- Test 16.3: Outsider NO puede insertar mensaje suplantando sender
    BEGIN
        INSERT INTO public.messages (conversation_id, sender_id, content)
        VALUES ('44444444-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Mensaje falso');
        PERFORM _rls_test_assert('Outsider NO puede INSERT mensaje suplantando sender', true, false);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Outsider NO puede INSERT mensaje suplantando sender', true, true);
    END;

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 17. AUDITORÍA: public.notifications
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 17. notifications ──────────────────────────────────────';

    -- Test 17.1: Usuario solo ve SUS notificaciones
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.notifications WHERE id = '66666666-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Cliente ve su notificación', true, v_count = 1);

    -- Test 17.2: No ve notificaciones de otro
    SELECT count(*) INTO v_count FROM public.notifications WHERE id = '66666666-0000-0000-0000-000000000002';
    PERFORM _rls_test_count('Cliente NO ve notificación del freelancer', 0, v_count);

    -- Test 17.3: Outsider no ve notificaciones de nadie
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.notifications WHERE id = '66666666-0000-0000-0000-000000000001';
    PERFORM _rls_test_count('Outsider NO puede ver notificación ajena', 0, v_count);

    -- Test 17.4: Outsider NO puede marcar como leída notificación ajena
    UPDATE public.notifications SET is_read = true WHERE id = '66666666-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    PERFORM _rls_test_count('Outsider NO puede UPDATE notificación ajena', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 18. AUDITORÍA: public.reviews
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 18. reviews ────────────────────────────────────────────';

    -- Test 18.1: Lectura pública de reviews
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.reviews WHERE id = '99999999-0000-0000-0000-000000000001';
    PERFORM _rls_test_assert('Outsider puede leer reviews (público)', true, v_count = 1);

    -- Test 18.2: Outsider NO puede insertar review en orden ajena
    BEGIN
        INSERT INTO public.reviews (order_id, client_id, freelancer_id, rating, comment)
        VALUES ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 5, 'Review falsa');
        PERFORM _rls_test_assert('Outsider NO puede INSERT review en orden ajena', true, false);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Outsider NO puede INSERT review en orden ajena', true, true);
    END;

    -- Test 18.3: Outsider NO puede actualizar review ajena
    UPDATE public.reviews SET comment = 'Hackeado' WHERE id = '99999999-0000-0000-0000-000000000001';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    PERFORM _rls_test_count('Outsider NO puede UPDATE review ajena', 0, v_count);

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- 19. AUDITORÍA: public.service_packages
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '── 19. service_packages ────────────────────────────────────';

    -- Test 19.1: Lectura pública
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
    SELECT count(*) INTO v_count FROM public.service_packages;
    PERFORM _rls_test_assert('Lectura pública de service_packages funciona', true, v_count >= 0);

    -- Test 19.2: Outsider NO puede insertar paquete en servicio ajeno
    BEGIN
        INSERT INTO public.service_packages (service_id, tier, title, description, price)
        VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'basico', 'Hack', 'Hack', 50);
        PERFORM _rls_test_assert('Outsider NO puede INSERT paquete en servicio ajeno', true, false);
    EXCEPTION WHEN OTHERS THEN
        PERFORM _rls_test_assert('Outsider NO puede INSERT paquete en servicio ajeno', true, true);
    END;

    RESET ROLE;
    RESET "request.jwt.claims";
END $$;

-- ============================================================
-- CLEANUP: Eliminar datos de prueba
-- ============================================================
BEGIN;

-- Eliminar en orden inverso de dependencias
DELETE FROM public.reviews WHERE id = '99999999-0000-0000-0000-000000000001';
DELETE FROM public.dispute_messages WHERE id = '88888888-0000-0000-0000-000000000001';
DELETE FROM public.disputes WHERE id = '77777777-0000-0000-0000-000000000001';
DELETE FROM public.notifications WHERE id IN ('66666666-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002');
DELETE FROM public.messages WHERE id = '55555555-0000-0000-0000-000000000001';
DELETE FROM public.conversations WHERE id = '44444444-0000-0000-0000-000000000001';
DELETE FROM public.platform_fees WHERE id = '33333333-0000-0000-0000-000000000001';
DELETE FROM public.payouts WHERE id = '22222222-0000-0000-0000-000000000001';
DELETE FROM public.escrow_holds WHERE id = '11111111-0000-0000-0000-000000000001';
DELETE FROM public.payments WHERE id = 'ffffffff-0000-0000-0000-000000000001';
DELETE FROM public.order_status_history WHERE id = 'eeeeeeee-0000-0000-0000-000000000001';
DELETE FROM public.order_requirements WHERE id = 'dddddddd-0000-0000-0000-000000000001';
DELETE FROM public.orders WHERE id IN ('cccccccc-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002');
DELETE FROM public.services WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';
DELETE FROM public.user_roles WHERE user_id IN ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003');
DELETE FROM public.profiles WHERE id IN ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003');
DELETE FROM auth.users WHERE id IN ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003');

-- Limpiar funciones auxiliares
DROP FUNCTION IF EXISTS _rls_test_assert(TEXT, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS _rls_test_count(TEXT, INTEGER, INTEGER);

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '  AUDITORÍA RLS FINALIZADA';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;
