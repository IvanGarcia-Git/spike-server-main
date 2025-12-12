# Tests Manuales: Fecha/Hora Inicio Opcionales en Tareas

## Casos de Prueba

### 1. Crear tarea sin fecha y sin hora
**Pasos:**
1. Abrir modal de nueva tarea (desde Kanban o calendario)
2. Dejar "Fecha Inicio" vacío
3. Dejar "Hora Inicio" vacío
4. Llenar "Asunto" con texto válido
5. Click en "Crear Tarea"

**Resultado esperado:**
- Tarea se crea correctamente
- En la BD: `startDate = NULL`
- Tarea aparece en el tablero Kanban
- Tarea NO aparece en vistas de calendario

---

### 2. Crear tarea con fecha pero sin hora
**Pasos:**
1. Abrir modal de nueva tarea
2. Seleccionar una fecha en "Fecha Inicio"
3. Dejar "Hora Inicio" vacío
4. Llenar "Asunto" con texto válido
5. Click en "Crear Tarea"

**Resultado esperado:**
- Tarea se crea correctamente
- En la BD: `startDate` contiene la fecha seleccionada con hora 00:00
- Tarea aparece en el tablero Kanban
- Tarea aparece en el calendario en el día seleccionado

---

### 3. Crear tarea con hora pero sin fecha (Opción B)
**Pasos:**
1. Abrir modal de nueva tarea
2. Dejar "Fecha Inicio" vacío
3. Seleccionar una hora en "Hora Inicio"
4. Llenar "Asunto" con texto válido
5. Click en "Crear Tarea"

**Resultado esperado:**
- Tarea se crea correctamente
- La hora se ignora (no hay fecha donde aplicarla)
- En la BD: `startDate = NULL`
- Tarea aparece en el tablero Kanban
- Tarea NO aparece en vistas de calendario

---

### 4. Crear tarea con fecha y hora
**Pasos:**
1. Abrir modal de nueva tarea
2. Seleccionar una fecha en "Fecha Inicio"
3. Seleccionar una hora en "Hora Inicio"
4. Llenar "Asunto" con texto válido
5. Click en "Crear Tarea"

**Resultado esperado:**
- Tarea se crea correctamente
- En la BD: `startDate` contiene fecha y hora combinadas
- Tarea aparece en el tablero Kanban
- Tarea aparece en el calendario en el día y hora seleccionados

---

### 5. Enviar tarea sin fecha (desde Send Task Modal)
**Pasos:**
1. Abrir modal "Enviar Tarea"
2. Dejar "Fecha inicio" vacío
3. Seleccionar un destinatario
4. Llenar "Asunto" con texto válido
5. Click en "Enviar"

**Resultado esperado:**
- Tarea se crea correctamente
- En la BD: `startDate = NULL`
- Tarea aparece en el historial con "Sin fecha" en la columna de fecha

---

### 6. Query/Filtro por rango no falla con startDate=null
**Pasos:**
1. Crear varias tareas, algunas con fecha y algunas sin fecha
2. Ir a la vista de calendario (día o semana)
3. Navegar por diferentes fechas

**Resultado esperado:**
- No hay errores en consola
- Solo las tareas CON fecha aparecen en el calendario
- Las tareas sin fecha siguen visibles en el tablero Kanban

---

### 7. Visualización de tarea sin fecha en detalle
**Pasos:**
1. Crear una tarea sin fecha
2. Click en la tarea para ver detalles

**Resultado esperado:**
- Modal de detalle se abre correctamente
- En "Fecha de inicio" muestra: "Sin fecha definida"
- No hay errores "Invalid Date"

---

## Verificación en Base de Datos

```sql
-- Verificar tareas sin fecha
SELECT id, uuid, subject, startDate, createdAt
FROM task
WHERE startDate IS NULL;

-- Verificar tareas con fecha
SELECT id, uuid, subject, startDate, createdAt
FROM task
WHERE startDate IS NOT NULL
ORDER BY startDate DESC;
```

## Ejecución de Migración

Antes de probar, ejecutar la migración:
```bash
cd spike-server-main
npm run migration:run
```
