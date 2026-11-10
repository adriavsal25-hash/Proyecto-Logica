# GUÍA DE INSTALACIÓN, DESPLIEGUE Y OPERACIÓN — SICOP-VE 2.0
**Manual de Despliegue Empresarial y Local**

---

## 1. REQUISITOS DEL SISTEMA

### Para Modo Local Autónomo (Standalone / Offline-First):
- Navegador web moderno: Google Chrome, Mozilla Firefox, Microsoft Edge, Safari u Opera.
- No se requiere servidor backend, compiladores ni dependencias externas.
- Puede ejecutarse directamente haciendo doble clic en `index.html` o a través del protocolo `file:///`.

### Para Despliegue Empresarial Centralizado (Docker / Cloud):
- **Docker:** Engine 24.0+ y Docker Compose 2.20+.
- **Node.js:** Versión 18.0.0 LTS o superior (opcional para ejecución manual sin Docker).
- **PostgreSQL:** Versión 16.0 o superior (incluido automáticamente en Docker Compose).
- **Memoria RAM:** Mínimo 2 GB (Recomendado 4 GB).
- **Almacenamiento:** Mínimo 1 GB de espacio libre en disco.

---

## 2. MODALIDADES DE DESPLIEGUE

### MODALIDAD A: Ejecución Autónoma Inmediata (Sin Servidores)
Ideal para evaluación rápida, inspección en campo, demostraciones académicas o entornos desconectados:
1. Abra su explorador de archivos y navegue hasta la raíz del proyecto:
   ```
   c:\Users\Adrian\UNC\Logica y Algoritmo\Proyecto\
   ```
2. Haga doble clic en el archivo **`index.html`**.
3. El sistema cargará instantáneamente con todas sus bibliotecas, iconos vectoriales, semillas institucionales y 11 nuevos módulos funcionales operando sobre el motor de persistencia local (`localStorage`).
4. Para correr la suite de pruebas unitarias y de integración, abra **`pruebas.html`**.

---

### MODALIDAD B: Despliegue Automatizado con Docker Compose
Recomendado para entornos institucionales de producción o pruebas centralizadas:

1. Abra una terminal en el directorio del proyecto:
   ```bash
   cd "c:\Users\Adrian\UNC\Logica y Algoritmo\Proyecto"
   ```
2. Inicie los contenedores en segundo plano:
   ```bash
   docker-compose up -d --build
   ```
3. Verifique el estado de los servicios:
   ```bash
   docker-compose ps
   ```
4. Los servicios estarán disponibles en los siguientes puertos:
   - **Base de Datos PostgreSQL 16:** `localhost:5432` (Usuario: `sicop_admin`, BD: `sicop_ve_db`)
   - **API RESTful Empresarial:** `http://localhost:3000/api/v2/sistema/salud`
   - **Frontend Web Institucional:** `http://localhost:8080` (o abra `index.html` en su navegador)

5. Para detener los contenedores:
   ```bash
   docker-compose down
   ```

---

### MODALIDAD C: Ejecución Manual del Backend (Node.js & TypeScript)
Si desea ejecutar el servidor de desarrollo para modificar endpoints o la lógica del backend:

1. Ingrese a la carpeta del servidor e instale las dependencias:
   ```bash
   cd server
   npm install
   ```
2. Configure sus variables de entorno copiando `.env.example` a `.env`:
   ```bash
   PORT=3000
   DATABASE_URL="postgresql://sicop_admin:sicop_secure_pass_2026@localhost:5432/sicop_ve_db?schema=public"
   JWT_SECRET="sicop_ve_secret_key_jwt_super_secure_2026_enterprise"
   TASA_BCV_DEFAULT=900.00
   ```
3. Ejecute las migraciones y semillas con Prisma:
   ```bash
   npx prisma db push
   ```
4. Inicie el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
5. El servidor responderá en `http://localhost:3000`.

---

## 3. USUARIOS Y CREDENCIALES DE DEMOSTRACIÓN

La plataforma incluye semillas de usuario preconfiguradas con diferentes roles para validar la gobernanza RBAC:

| Nombre de Usuario | Correo Electrónico | Contraseña | Rol / Perfil | Institución Asociada |
|---|---|---|---|---|
| **Ing. Marcos Rivas** | `marcos.rivas@miranda.gob.ve` | `admin123` | **SuperAdmin** | Gobernación del Estado Miranda |
| **Ing. Ana Pérez** | `ana.perez@miranda.gob.ve` | `admin123` | **Gobernación** | Gobernación del Estado Miranda |
| **Dra. Elena Blanco** | `elena.blanco@chacao.gob.ve` | `admin123` | **Alcaldía** | Alcaldía del Municipio Chacao |
| **Arq. Carlos Mendoza** | `carlos.mendoza@constructora.com` | `admin123` | **Contratista** | Constructora Capital C.A. |
| **Lic. Carmen Urdaneta** | `carmen.urdaneta@auditoria.gob.ve` | `admin123` | **Auditor** | Contraloría General del Estado Miranda |
| **Tec. Roberto Gómez** | `roberto.gomez@obras.gob.ve` | `admin123` | **Operador** | Dirección de Obras Públicas Miranda |

> **Nota:** En la pantalla de inicio de sesión (`index.html`), dispone de un selector rápido de usuarios que permite alternar entre cualquiera de estos perfiles con un solo clic.

---

## 4. VERIFICACIÓN Y SUITE DE PRUEBAS AUTOMATIZADAS

SICOP-VE 2.0 cuenta con una suite de **75 pruebas automatizadas exhaustivas** que evalúan:
- Cálculos matemáticos de cotización, IVA (16%) y contingencia (5%).
- Algoritmo de ordenamiento burbuja manual para ciudades y fletes.
- Calculadora paramétrica de obra con sus 30 plantillas constructivas.
- Sistema de financiamiento por cuotas (esquema Cashea e institucional).
- Tasa oficial BCV a 900,00 Bs./USD en todos los módulos.
- Control financiero institucional, recuperación de cartera y proyecciones.
- Semáforo presupuestario con umbrales dinámicos.
- Conciliación de pagos bancarios y registro inmutable de auditoría.
- Directorio de proveedores y detección de aumentos de precios (>=15%).
- Generación de hashes criptográficos SHA-256 para certificados de obra.
- Detección heurística de alertas inteligentes.

### Ejecución de Pruebas:
Abra el archivo **`pruebas.html`** en cualquier navegador web. El sistema ejecutará automáticamente las 75 pruebas y presentará el informe:
- **Total de Casos:** 75
- **Pruebas Aprobadas:** 75 (100% verde)
- **Pruebas Fallidas:** 0

