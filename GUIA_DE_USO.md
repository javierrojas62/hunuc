# 📖 Guía de uso — Almacén Natural Hunuc Pachacutek

Manual rápido y sencillo. Hay dos tipos de usuario: **Administrador** (ve y maneja todo) y **Vendedor** (vende y consulta).

---

## 🔑 Cómo entrar

1. Abrí la app.
2. Escribí tu **email** y **contraseña**.
3. Apretá **Ingresar**.

> ¿Olvidaste o no tenés contraseña? Pedísela a un administrador.

---

## 👑 Manual del ADMINISTRADOR

El admin puede hacer **todo**. Estos son los pasos típicos del día:

### 1. Abrir la caja (¡lo primero del día!)
> ⚠️ **Sin caja abierta NO se pueden registrar ventas.**
1. Entrá a **Caja** (menú lateral).
2. Escribí el **monto inicial** (la plata con la que arranca el cajón).
3. Apretá **Abrir caja**.

### 2. Cargar / editar productos
- Andá a **Productos**.
- **Nuevo**: botón arriba a la derecha → completás nombre, precio, unidad, etc. → **Guardar**.
- **Editar**: en cada producto, los tres puntitos `⋯` → **Editar**.
- **Cambiar el stock**: `⋯` → **Ajustar stock** (queda registrado quién y cuándo).
- **Ocultar un producto**: `⋯` → **Desactivar**.

### 3. Importar muchos productos de un Excel
1. **Productos → Importar**.
2. Arrastrá tu archivo Excel/CSV (o hacé clic para elegirlo).
3. La app limpia y ordena todo solo. Revisás la vista previa.
4. Apretá **Importar**.

### 4. Vender
Igual que el vendedor (ver abajo, sección "Vender").

### 5. Registrar ingresos o egresos de caja
- En **Caja**: botón **Ingreso** (entra plata que no es venta) o **Egreso** (sale plata: gastos, retiros).

### 6. Cerrar la caja (fin del día)
1. **Caja → Cerrar caja**.
2. Contá la plata real del cajón y escribí el total.
3. La app te muestra la **diferencia** (si sobra o falta).
4. Apretá **Cerrar caja**.

### 7. Ver el negocio (Inicio / Dashboard)
- En **Inicio** ves: ventas del día/semana/mes, gráfico, productos más vendidos, stock bajo y mejores vendedores.

### 8. Gestionar usuarios
- **Usuarios** → **Nuevo usuario** → elegís nombre, email, contraseña y **Rol** (Vendedor o Administrador).
- Podés cambiar el rol o activar/desactivar a cualquiera desde la lista.

### 9. Auditoría (quién hizo qué)
- **Auditoría** → ves cada acción: ingresos, ventas, cambios de precio, etc., con fecha y dispositivo.

---

## 🛒 Manual del VENDEDOR

El vendedor se enfoca en **vender rápido** y consultar. (No puede cambiar precios, ni ver ganancias, ni abrir/cerrar caja.)

### Vender (lo principal)
1. Entrá a **Vender (POS)**.
2. **Buscá** el producto escribiendo el nombre o el código.
3. Hacé **clic** en el producto → se agrega al carrito (a la derecha).
4. Ajustá la **cantidad** con los botones **+ / −** si hace falta.
5. Elegí cómo paga el cliente: **Efectivo**, **Transferencia** o **Mercado Pago**.
6. (Opcional) Cargá un **descuento**.
7. Apretá **Cobrar**.
8. Aparece el **ticket** con el número y el total. Apretá **Nueva venta** para seguir.

### Consultar
- **Productos**: buscar precios y ver stock (no podés editar).
- **Ventas**: ver tus ventas del día y su detalle.
- **Caja**: ver los movimientos (sin abrir ni cerrar).
- **Inicio**: tus ventas del día y productos más vendidos.

> Si te aparece **"No hay caja abierta"**, avisale al administrador para que la abra.

---

## ❓ Preguntas rápidas

- **¿Cómo hago a alguien admin o vendedor?** El admin lo elige en **Usuarios** (al crearlo o cambiándole el rol). El primer admin se configura una sola vez por SQL (ver README).
- **¿Por qué no me deja vender?** Falta **abrir la caja** (lo hace el admin).
- **¿Modo oscuro?** Botón de sol/luna arriba a la derecha.
- **¿Se puede usar en el celular?** Sí, está pensada para celular, notebook y escritorio.
