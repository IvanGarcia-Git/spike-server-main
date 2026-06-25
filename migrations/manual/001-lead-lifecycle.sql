-- Migración manual para ciclo de vida de leads (solo MySQL)
-- Ejecutar en producción con precaución

-- 1. Añadir campos a la tabla `lead`
ALTER TABLE `lead` 
ADD COLUMN `status` varchar(50) DEFAULT 'activo' COMMENT 'Estado del lead: activo/muerto/callback',
ADD COLUMN `attempt_count` int DEFAULT 0 COMMENT 'Número de intentos de llamada',
ADD COLUMN `next_call_date` datetime NULL COMMENT 'Fecha próxima llamada (callback)',
ADD COLUMN `agent_rotation_history` json NULL COMMENT 'Historial de agentes [{userId, timestamp}]',
ADD COLUMN `whatsapp_number` varchar(20) NULL COMMENT 'WhatsApp (obligatorio intento 6)',
ADD COLUMN `is_permanently_assigned` boolean DEFAULT FALSE COMMENT 'Bloqueado tras intento 6',
ADD COLUMN `last_tipification_id` int NULL COMMENT 'Última tipificación aplicada';

-- 2. Crear tabla `tipification`
CREATE TABLE IF NOT EXISTS `tipification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL COMMENT 'contacto/no_contacto/descarte',
  `action` varchar(50) NOT NULL COMMENT 'cerrar/reintento/callback/ventas/seguimiento',
  `retry_hours` int NULL COMMENT 'Horas espera reintento',
  `requires_whatsapp` boolean DEFAULT FALSE,
  `is_active` boolean DEFAULT TRUE,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Crear tabla `lead_tipification_history`
CREATE TABLE IF NOT EXISTS `lead_tipification_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `tipification_id` int NOT NULL,
  `user_id` int NOT NULL COMMENT 'Agente que tipificó',
  `observation` text NULL,
  `attempt_count_at_tipification` int NOT NULL COMMENT 'Intentos en momento de tipificar',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_tipification_lead` (`lead_id`),
  KEY `idx_lead_tipification_tipification` (`tipification_id`),
  KEY `idx_lead_tipification_user` (`user_id`),
  CONSTRAINT `fk_lth_lead` FOREIGN KEY (`lead_id`) REFERENCES `lead`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lth_tipification` FOREIGN KEY (`tipification_id`) REFERENCES `tipification`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_lth_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Añadir índice para búsquedas por status y next_call_date
CREATE INDEX `idx_lead_status_next_call` ON `lead` (`status`, `next_call_date`);

-- 5. Insertar tipificaciones por defecto
INSERT INTO `tipification` (`name`, `category`, `action`, `retry_hours`, `requires_whatsapp`) VALUES
-- CONTACTO EFECTIVO
('Interesado', 'contacto', 'ventas', NULL, FALSE),
('No interesado', 'contacto', 'cerrar', NULL, FALSE),
('Ya es cliente', 'contacto', 'cerrar', NULL, FALSE),
('Volver a llamar', 'contacto', 'callback', NULL, FALSE),
('No es el momento', 'contacto', 'reintento', 168, FALSE),
('Pide información', 'contacto', 'seguimiento', NULL, FALSE),
('Interesado pero ocupado', 'contacto', 'reintento', 2, FALSE),
('Cita agendada', 'contacto', 'agenda', NULL, FALSE),
-- NO CONTACTO
('No contesta', 'no_contacto', 'reintento', NULL, FALSE),
('Ocupado', 'no_contacto', 'reintento', NULL, FALSE),
('Apagado / fuera de cobertura', 'no_contacto', 'reintento', NULL, FALSE),
('Cuelga llamada', 'no_contacto', 'reintento', NULL, FALSE),
('Salta buzón de voz', 'no_contacto', 'reintento', NULL, FALSE),
('Teléfono no disponible temporalmente', 'no_contacto', 'reintento', NULL, FALSE),
-- DESCARTE
('Número incorrecto', 'descarte', 'cerrar', NULL, FALSE),
('No existe', 'descarte', 'cerrar', NULL, FALSE),
('Datos falsos', 'descarte', 'cerrar', NULL, FALSE),
('No llamar', 'descarte', 'cerrar', NULL, FALSE),
('Spam / lead basura', 'descarte', 'cerrar', NULL, FALSE);
