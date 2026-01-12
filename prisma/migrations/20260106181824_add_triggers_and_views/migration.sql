-- Función para Auditoría Genérica
CREATE OR REPLACE FUNCTION fn_audit_log() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO logs_auditoria (id, "tenantId", tabla, operacion, "registroId", "valorAnterior", fecha)
        VALUES (gen_random_uuid()::text, OLD."tenantId", TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD)::jsonb, now());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO logs_auditoria (id, "tenantId", tabla, operacion, "registroId", "valorAnterior", "valorNuevo", fecha)
        VALUES (gen_random_uuid()::text, NEW."tenantId", TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, now());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO logs_auditoria (id, "tenantId", tabla, operacion, "registroId", "valorNuevo", fecha)
        VALUES (gen_random_uuid()::text, NEW."tenantId", TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW)::jsonb, now());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar Auditoría a tablas clave
CREATE TRIGGER trg_audit_producto AFTER INSERT OR UPDATE OR DELETE ON productos FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_cliente AFTER INSERT OR UPDATE OR DELETE ON clientes FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_audit_venta AFTER INSERT OR UPDATE OR DELETE ON ventas FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- Trigger para Alertas de Stock
CREATE OR REPLACE FUNCTION fn_check_stock_alert() RETURNS TRIGGER AS $$
BEGIN
    IF (NEW."stockActual" <= NEW."stockMinimo") THEN
        -- Insertar solo si no hay una alerta no resuelta para este producto
        IF NOT EXISTS (SELECT 1 FROM alertas_stock WHERE "productoId" = NEW.id AND resuelta = false) THEN
            INSERT INTO alertas_stock (id, "tenantId", "productoId", producto, "stockActual", "stockMinimo", resuelta, fecha)
            VALUES (gen_random_uuid()::text, NEW."tenantId", NEW.id, NEW.nombre, NEW."stockActual", NEW."stockMinimo", false, now());
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alerta_stock AFTER UPDATE OR INSERT ON productos FOR EACH ROW EXECUTE FUNCTION fn_check_stock_alert();

-- Vistas Inteligentes
CREATE OR REPLACE VIEW v_saldo_clientes AS
SELECT 
    "clienteId", 
    "tenantId",
    SUM(CASE WHEN tipo = 'DEBITO' THEN monto ELSE -monto END) as saldo_actual
FROM movimientos_cta_cte
GROUP BY "clienteId", "tenantId";

CREATE OR REPLACE VIEW v_kpis_hoy AS
SELECT 
    "tenantId",
    COUNT(*) as ventas_count,
    SUM(total) as total_ventas,
    CURRENT_DATE as fecha
FROM ventas
WHERE fecha >= CURRENT_DATE
GROUP BY "tenantId";