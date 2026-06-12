# KUROSHI.TV
## Documento de Requisitos del Sistema
*Plataforma de Streaming y Red Social de Anime*

**Versión 1.0 | Junio 2026**
**Confidencial - Uso Interno**

---

# 1. Visión General del Proyecto

Kuroshi.tv es una plataforma web de streaming de anime con componentes de red social integrada, orientada al público latinoamericano hispanohablante. La propuesta de valor diferencial frente a competidores existentes como JKAnime o AnimeFLV es la construcción de una comunidad activa dentro del propio sitio, eliminando la necesidad de que los usuarios migren a plataformas externas como Discord o Amino para interactuar con otros fans.

El concepto central es la fusión entre un reproductor de anime gratuito y una red social ligera estilo Amino, donde los usuarios puedan ver contenido, publicar en comunidades, chatear, y construir una identidad de otaku, todo dentro de un mismo ecosistema.

## 1.1 Nombre y Dominio

- **Nombre del proyecto:** Kuroshi.tv
- **Significado:** Kuro (negro en japonés) + Shi (muerte), estética oscura y anime
- **Dominio registrado:** kuroshi.tv

## 1.2 Modelo de Negocio

- Acceso completamente gratuito para todos los usuarios
- Sin niveles premium ni suscripciones de pago
- Monetización exclusiva mediante publicidad no intrusiva
- Objetivo de ingresos: salario básico mensual (~300-400 USD) como meta inicial
- Redes publicitarias objetivo: Hilltopads, Adsterra, Monetag (compatibles con sitios de streaming)

## 1.3 Estrategia de Anuncios

La filosofía de publicidad de Kuroshi.tv prioriza la experiencia del usuario. Se rechazan formatos agresivos como popups, redirects o banners que bloqueen el contenido. Los formatos permitidos son:

- Banner estático en header o footer
- Anuncio pre-roll antes del video (máximo 15 segundos)
- Banner lateral en pantallas desktop
- Anuncio integrado en el feed cada 5 a 6 posts (estilo nativo, no intrusivo)
- Anuncio de fin configurado para aparecer exactamente cuando inicia el ending del episodio, aprovechando el momento natural de transición entre episodios

## 1.4 Métricas de Referencia del Mercado

| Plataforma | Visitas Mensuales | Ingreso Estimado Anual | Audiencia Principal |
|---|---|---|---|
| JKAnime.net | 30.6 millones | No público | México, Colombia, España |
| AnimeFLV | 50+ millones | $10M - $15M USD | LATAM + España |
| TioAnime | 4.6 millones | No público | LATAM |
| Kuroshi.tv (meta año 1) | 100k - 500k | $200 - $800 USD/mes | LATAM hispanohablante |

## 1.5 Proyección de Ingresos

| Periodo | Visitas Mensuales Estimadas | Ingreso Mensual Estimado |
|---|---|---|
| Mes 1 al 3 | 0 a 2,000 | $0 |
| Mes 4 al 6 | 2,000 a 20,000 | $10 a $40 USD |
| Mes 7 al 12 | 20,000 a 100,000 | $50 a $200 USD |
| Año 2 | 100,000 a 500,000 | $200 a $800 USD |
| Año 3 | 500,000 a 2,000,000 | $800 a $3,000 USD |

---

# 2. Infraestructura y Presupuesto Inicial

## 2.1 Presupuesto de Arranque

El proyecto está diseñado para arrancar con un presupuesto máximo de 40 dólares. La arquitectura técnica se ha diseñado específicamente para minimizar costos sin sacrificar funcionalidad.

| Componente | Servicio | Costo Mensual |
|---|---|---|
| Dominio .tv | Porkbun o Namecheap | $2.50 USD (pago anual ~$30) |
| Servidor VPS | Hetzner (plan básico) | $4 a $6 USD |
| Almacenamiento de imágenes | Imgur API (tier gratuito) | $0 |
| Chat en tiempo real | Supabase o Pusher (tier gratuito) | $0 |
| CDN para video | Embeds de terceros | $0 |
| **TOTAL MES 1** | | **~$14 a $16 USD** |

## 2.2 Modelo de Hosting de Video

Kuroshi.tv no almacena videos propios. Se utiliza el modelo de embed de terceros, donde el video reside en servidores externos y Kuroshi solo muestra el reproductor embebido.

- Servidores de video compatibles: Streamtape, Filemoon, YourUpload, entre otros
- El administrador sube los links de embed por episodio desde el panel de administración
- Se pueden añadir múltiples servidores por episodio para redundancia
- El usuario puede cambiar de servidor si uno falla

## 2.3 Almacenamiento de Imágenes de Usuario

Las imágenes subidas por usuarios (en posts de comunidades) se gestionan a través de la API gratuita de Imgur. El flujo es transparente para el usuario:

- El usuario selecciona una imagen desde su dispositivo
- El sitio la sube a Imgur en segundo plano vía API
- Imgur retorna un link directo permanente
- La imagen se muestra en el post usando ese link
- Costo de almacenamiento para Kuroshi.tv: cero dólares

## 2.4 Chat en Tiempo Real

Para el chat de comunidades y el chat de episodios en tiempo real se utilizará Supabase Realtime o Pusher, ambos con tiers gratuitos generosos suficientes para la fase inicial del proyecto.

---

# 3. Arquitectura de Contenido y Secciones

## 3.1 Secciones Principales

| Sección | Estado en Fase 1 | Descripción |
|---|---|---|
| Anime | Activa | Sección principal de contenido |
| Manga | Próximamente | Desactivada, visible como futura |
| Manhwa | Próximamente | Desactivada, visible como futura |
| Juegos | Próximamente | Desactivada, visible como futura |
| Comunidades | Activa | Red social y comunidades de fans |

## 3.2 Sistema de Comunidades

Las comunidades son el núcleo social de Kuroshi.tv. Cualquier usuario registrado puede crear una comunidad sobre cualquier tema relacionado con la cultura otaku.

### Tipos de Comunidades

- **Comunidades No Oficiales:** creadas por cualquier usuario, tienen la etiqueta de comunidad de fans
- **Comunidades Oficiales:** creadas directamente por el owner o administradores, o promovidas desde no oficial por decisión de los administradores, identificadas con badge de verificación

### Sistema de Promoción a Oficial

- Se muestra una barra de progreso visible: por ejemplo, 847 de 1000 miembros para ser oficial
- Los administradores pueden aprobar o rechazar la promoción con razón escrita
- Las comunidades oficiales también pueden ser degradadas a no oficiales si la actividad cae

### Estructura Interna de una Comunidad

- Feed de posts con scroll infinito
- Chat en tiempo real estilo Discord
- Lista de miembros con roles
- Sección de información, descripción y reglas

## 3.3 Sistema de Roles Globales

| Rol | Descripción | Permisos Clave |
|---|---|---|
| Owner | Propietario del sitio (único) | Acceso total e irrestricto a todo |
| Moderador | Designado por el owner | Moderar contenido, añadir anime, promover comunidades. No puede banear ni eliminar cuentas |
| Usuario | Cuenta registrada estándar | Ver, publicar, comentar, crear comunidades, interactuar |
| Visitante | Sin cuenta registrada | Solo ver anime y leer contenido público |

---

# 4. Requisitos Funcionales por Pantalla

## 4.1 Pantalla Home (Página Principal)

**URL:** kuroshi.tv

### Componentes del Header (fijo en todas las pantallas)

- Logo de Kuroshi.tv alineado a la izquierda
- Buscador central para anime y comunidades
- Icono separado de búsqueda de usuarios (solo visible con sesión iniciada)
- Botón de inicio de sesión
- Botón de registro destacado visualmente

### Barra de Navegación Secundaria (fija debajo del header)

- Accesos directos: Inicio, Anime, Manga, Manhwa, Juegos, Comunidades
- Las secciones no activas muestran etiqueta *Próximamente*
- Indica visualmente la sección activa actual

### Contenido de la Página Principal

- Hero o banner principal con anime destacado del momento y un anuncio banner integrado
- Sección de últimos episodios subidos: grid de tarjetas con miniatura, título, número de episodio y tiempo desde la subida. Al hacer hover muestra sinopsis corta, calificación de MyAnimeList, géneros y botón *Ver ahora*
- Sección de tendencias de la semana: top 10 animes más vistos con barra de popularidad

## 4.2 Pantalla Catálogo de Anime

**URL:** kuroshi.tv/anime

### Filtros Disponibles

- Búsqueda por nombre
- Género: Acción, Romance, Terror, Isekai, Shonen, entre otros
- Estado: En emisión, Finalizado, Próximamente
- Temporada y año: Invierno, Primavera, Verano, Otoño
- Estudio de animación
- Orden: más populares, mejor valorados según MAL, más recientes, orden alfabético
- Botón para limpiar todos los filtros

### Secciones del Catálogo

- Animes en emisión ahora: carrusel horizontal scrolleable con etiqueta *NUEVO EP HOY* cuando corresponde
- Catálogo completo: grid responsivo con 5 a 6 columnas en desktop y 2 a 3 en móvil, paginación de 20 animes por página
- Cada tarjeta muestra: poster del anime, título, rating de MyAnimeList, estado. Al hover muestra sinopsis y géneros
- Sección por géneros: tabs clickeables mostrando top 10 de cada género

## 4.3 Pantalla Página Individual de Anime

**URL:** kuroshi.tv/anime/nombre-del-anime

### Sección Superior de Información

- Banner ancho del anime como imagen de fondo difuminada
- Poster del anime a la izquierda
- Información a la derecha: título en español y japonés, rating de MyAnimeList, rating propio de la comunidad Kuroshi basado en votos de usuarios, géneros, año, temporada, estado, estudio de animación, número de episodios, sinopsis completa con opción *ver más*

### Botones de Acción

- **Ver desde el principio:** siempre visible
- **Continuar:** visible solo si el usuario ya vio algún episodio, muestra el episodio y minuto exacto donde se quedó. No disponible sin sesión
- **Añadir a mi lista:** permite seleccionar estado Viendo, Completado, Pendiente o Abandonado. Requiere sesión
- **Notificarme de nuevos episodios:** requiere sesión

### Lista de Episodios

- Selector de temporada arriba: Temporada 1, Temporada 2, OVAs, Especiales
- Lista vertical de tarjetas clickeables en cualquier parte
- Cada tarjeta muestra: miniatura pequeña a la izquierda, prefijo de número de episodio seguido del título, icono de play a la derecha
- Al hacer click en cualquier parte de la tarjeta se abre la página del reproductor del episodio
- Buscador de episodio por número
- Orden ascendente y descendente

### Secciones Adicionales

- Animes relacionados: misma temporada, mismo estudio, mismo género. Carrusel horizontal
- Comentarios generales del anime: opiniones completas tipo reseña, con likes y respuestas, etiqueta de spoiler, orden por recientes o valorados. Solo lectura sin sesión

### Sistema de Rating

- **Rating de MyAnimeList:** importado automáticamente vía API pública de MyAnimeList o AniList, mostrado con atribución
- **Rating de Kuroshi:** sistema de estrellas del 1 al 5 votado por usuarios registrados, mostrado con cantidad de votos
- Las tarjetas del catálogo muestran únicamente el rating de MyAnimeList para garantizar valor desde el primer día

## 4.4 Pantalla Reproductor de Episodio

**URL:** kuroshi.tv/anime/nombre-del-anime/episodio-14

### Zona del Reproductor

- Video embed del servidor seleccionado, ocupa aproximadamente el 70% del ancho de pantalla
- Barra de servidores debajo del video: Servidor 1, Servidor 2, Servidor 3. El usuario elige y cambia si uno falla
- Controles de navegación: episodio anterior, episodio siguiente, modo Picture in Picture
- Anuncio pre-roll antes de iniciar el episodio, duración máxima 15 segundos
- Anuncio configurado para aparecer exactamente al inicio del ending del episodio

### Chat del Episodio en Tiempo Real (panel derecho, 30% del ancho)

Esta es la característica diferenciadora principal de Kuroshi.tv. El chat por minuto crea la sensación de ver un stream en compañía, incluso cuando el usuario está solo.

- Los comentarios están anclados al minuto exacto del video en que fueron escritos
- Mientras el usuario ve el episodio, cada 10 segundos aparece el comentario que corresponde al momento actual del video
- Si nadie comentó ese momento exacto, el sistema salta al comentario más cercano disponible
- El chat nunca se ve vacío: los comentarios históricos de todos los usuarios que vieron el episodio antes son permanentes
- Contador discreto de usuarios viendo el episodio en ese momento
- Sistema de votos: los comentarios con más likes flotan arriba, el spam se hunde automáticamente
- Límite de 200 caracteres por comentario
- Un comentario por minuto del episodio por usuario para evitar spam
- Botón *ver todos los comentarios* para ver el historial completo del episodio
- Escribir requiere sesión activa. Sin sesión se puede leer pero no escribir

### Zona Inferior del Reproductor

- Título del episodio, número, temporada y anime al que pertenece
- Fecha de emisión original
- Sinopsis corta del episodio sin spoilers mayores
- Selector horizontal de episodios con el episodio actual destacado
- Animes relacionados en carrusel horizontal
- Comentarios generales del episodio: separados del chat en tiempo real, son opiniones completas con opción de marcar spoiler, likes y respuestas

## 4.5 Pantalla Login y Registro

### Opciones de Autenticación

- **Continuar con Google:** autenticación OAuth con cuenta de Google
- **Continuar con Discord:** autenticación OAuth con cuenta de Discord (prioritaria para el público objetivo otaku)
- **Registro con email:** formulario minimalista con solo tres campos obligatorios: email, nombre de usuario único visible para todos, y contraseña

### Política de Verificación

- Se envía email de verificación al registrarse con email
- El email de verificación **NO bloquea el acceso:** el usuario puede usar el sitio inmediatamente y verificar su correo después
- Las cuentas de Google y Discord se consideran verificadas automáticamente

## 4.6 Pantalla Perfil de Usuario

**URL:** kuroshi.tv/u/nombre-de-usuario

### Sección Superior del Perfil

- Imagen de portada: se genera automáticamente usando el banner oficial del anime favorito declarado por el usuario
- Avatar personalizable subido por el usuario
- Nombre de usuario
- Bio corta opcional
- Fecha de registro mostrada como *Otaku desde [mes] [año]*

### Estadísticas Rápidas (fila horizontal)

- Total de episodios vistos
- Horas totales invertidas en el sitio
- Anime favorito declarado
- Número de amigos
- Número de comunidades a las que pertenece

### Tabs de Navegación del Perfil

- **Mi Lista:** animes organizados por estado con filtros y opciones de orden
- **Actividad:** feed cronológico de acciones recientes
- **Comunidades:** lista de comunidades con rol del usuario en cada una
- **Amigos:** lista de amigos con estado online, buscador y solicitudes pendientes

### Sistema de Estados de Anime en la Lista

| Estado | Color | Condición Automática |
|---|---|---|
| Viendo | Verde | Vio algún episodio en los últimos 5 días |
| Completado | Azul check | Vio el último episodio disponible del anime |
| Pendiente | Azul | Lo guardó o le dio favorito pero nunca comenzó a verlo |
| Abandonado | Rojo | Estaba en Viendo pero pasaron más de 5 días sin ver |

- Si el usuario retoma un anime que estaba Abandonado, el sistema lo devuelve a Viendo automáticamente y muestra el mensaje *Retomaste [nombre del anime]*
- El usuario puede sobreescribir el estado manualmente en cualquier momento
- Cuando el usuario cambia el estado manualmente, el sistema respeta esa decisión y no la cambia automáticamente

### Sistema de Logros y Rangos

- Rangos con nombres de universos anime que aumentan con la actividad y episodios vistos
- Barra de progreso visible hacia el siguiente rango
- Logros desbloqueables por hitos como ver 100 episodios, 500 horas vistas, unirse a 5 comunidades, entre otros
- Los logros bloqueados son visibles pero no revelados completamente, generando curiosidad

### Vista del Perfil de Otro Usuario

- Botones cambian a: Añadir amigo, Seguir, Mensaje directo (fase 2)
- Si el perfil es **Público:** se ve todo el contenido igual que el perfil propio
- Si el perfil es **Solo amigos:** solo los amigos confirmados ven la lista y actividad
- Si el perfil es **Privado:** solo se ven las estadísticas básicas y el avatar

## 4.7 Pantalla Mi Lista Personal

**URL:** kuroshi.tv/u/nombre-usuario/lista

- Estadísticas resumidas: total de animes, episodios vistos, horas acumuladas
- Tabs por estado: Viendo, Completado, Pendiente, Abandonado con contador de cada uno
- Opciones de orden: últimos activos, alfabético, rating MAL, progreso
- Vista en grid: cover, título, progreso y estado
- Vista en lista: cover pequeño, título, barra de progreso visual, rating personal de 1 a 5 estrellas, estado, botones *Continuar viendo*, *Cambiar estado* y *Quitar de la lista*

## 4.8 Pantalla Explorar Comunidades

**URL:** kuroshi.tv/comunidades

- Buscador de comunidades por nombre
- Filtros: tipo oficial o no oficial, sección temática, orden por más activas hoy, más miembros o más recientes
- Sección de comunidades oficiales destacadas en grid grande
- Sección trending del día con las 5 comunidades más activas
- Catálogo completo con paginación de 20 por página
- Sección motivacional *Crea tu comunidad* para usuarios registrados

## 4.9 Pantalla Comunidad Individual

**URL:** kuroshi.tv/comunidad/nombre-de-la-comunidad

### Vista Exterior (usuario no miembro)

- Banner, nombre, descripción, tipo oficial o no oficial, contador de miembros y activos ahora
- Vista previa de 5 a 6 posts recientes bloqueados para interacción
- Banner de llamada a unirse

### Vista Interior — Tab Feed

- Columna izquierda 70%: input para crear post con texto, imagen vía Imgur y link a episodio de Kuroshi. Feed infinito de posts con like, comentar, compartir y reportar
- Columna derecha 30%: descripción de la comunidad, reglas, creador y mods, miembros activos ahora, comunidades relacionadas

### Vista Interior — Tab Chat

- Chat en tiempo real estilo Discord
- Mensajes con avatar, nombre de usuario y hora
- Responder a mensajes específicos
- Reacciones con emojis
- Menciones con arroba
- Los moderadores pueden eliminar mensajes
- Historial scrolleable hacia atrás

### Vista Interior — Tab Miembros

- Lista completa de miembros con filtros: todos, mods, activos hoy
- Muestra avatar, nombre y rango o XP
- Click en usuario lleva a su perfil

### Vista Interior — Tab Sobre esta Comunidad

- Descripción completa y reglas detalladas
- Estadísticas: miembros totales, posts totales, fecha de creación
- Para comunidades no oficiales: barra de progreso hacia comunidad oficial con número actual y umbral requerido

## 4.10 Pantalla Resultados de Búsqueda

**URL:** kuroshi.tv/buscar?q=termino

- Tabs de resultados: Anime, Comunidades, Usuarios con contador de resultados en cada tab
- **Tab Anime:** filtros laterales por género, estado, año y orden. Lista de resultados con cover, título japonés y español, géneros, rating MAL, sinopsis corta
- **Tab Comunidades:** imagen, nombre, tipo, descripción corta, número de miembros, botón unirse
- **Tab Usuarios:** avatar, nombre, bio corta, amigos en común, botón añadir amigo o seguir
- Paginación de 20 resultados por página en todos los tabs

## 4.11 Pantalla Notificaciones

**URL:** kuroshi.tv/notificaciones

### Tipos de Notificaciones

- Nuevo episodio disponible de anime en la lista del usuario
- Like o comentario en un post propio
- Solicitud de amistad recibida o aceptada
- Comunidad del usuario llegó a un hito de miembros
- Retoma de anime con mensaje celebratorio
- Logro desbloqueado
- Comunidad promovida a oficial

### Configuración de Notificaciones

- Toggle independiente para cada tipo de notificación
- Opción marcar todas como leídas
- Filtros: todas, anime, social, comunidades
- Paginación de 20 por página

## 4.12 Pantalla Configuración de Cuenta

**URL:** kuroshi.tv/configuracion

### Sección Perfil

- Cambiar avatar
- Cambiar nombre de usuario (permitido cada 30 días)
- Editar bio corta de hasta 150 caracteres
- Seleccionar anime favorito que define el banner automático del perfil

### Sección Cuenta

- Cambiar email
- Cambiar contraseña
- Cuentas vinculadas: Google y Discord con opción de conectar o desconectar
- Zona de peligro: desactivar cuenta temporalmente o eliminar permanentemente con confirmación escribiendo el nombre de usuario

### Sección Privacidad

- Visibilidad del perfil: Público, Solo amigos, Solo amigos y seguidores, Privado
- Visibilidad de la lista de animes: Público, Solo amigos, Privado
- Visibilidad de la actividad: Público, Solo amigos, Privado
- Quién puede enviar solicitud de amistad: Todos o Nadie
- Aparecer en usuarios activos ahora: toggle sí o no

### Sección Apariencia

- Tema: Oscuro (predeterminado) o Claro
- Idioma: Español (único en Fase 1, Inglés planificado para Fase 2)

---

# 5. Panel de Administración

**URL:** kuroshi.tv/admin

Accesible exclusivamente para el owner y los moderadores designados.

## 5.1 Dashboard Principal

### Métricas en Tiempo Real

- Usuarios activos en el sitio en este momento
- Episodios siendo reproducidos ahora mismo
- Mensajes enviados en chats hoy
- Nuevos registros hoy

### Métricas del Mes

- Visitas totales del mes
- Usuarios registrados acumulados
- Top de episodios más vistos
- Comunidades más activas del mes

## 5.2 Gestión de Anime

### Formulario Añadir o Editar Anime

- Importación automática desde la API de MyAnimeList o AniList: búsqueda por nombre que autocompleta título en español y japonés, sinopsis, géneros, año, temporada, estudio, episodios totales, cover, banner y rating
- Todos los campos son editables manualmente después de importar
- Campo de estado editable: En emisión, Finalizado, Próximamente

## 5.3 Gestión de Episodios

### Configuración de Anuncios por Episodio (crítico)

- **Anuncio de inicio:** toggle activado o desactivado, minuto de aparición editable con valor predeterminado 0:00, duración máxima editable con valor predeterminado 15 segundos
- **Anuncio de fin o ending:** toggle activado o desactivado, campo para definir el minuto exacto donde inicia el ending del episodio
- Opción alternativa: configurar el anuncio de fin para que aparezca al finalizar el episodio en lugar del ending
- Todos los valores heredan de la configuración global pero pueden sobreescribirse por episodio individualmente

## 5.4 Gestión de Usuarios

### Permisos de Moderadores

| Acción | Owner | Moderador |
|---|---|---|
| Eliminar comentarios y posts | Sí | Sí |
| Silenciar usuarios | Sí | Sí |
| Promover comunidades a oficial | Sí | Sí |
| Añadir y editar anime y episodios | Sí | Sí |
| Ver estadísticas del sitio | Sí | No |
| Banear usuarios | Sí | No |
| Eliminar cuentas | Sí | No |
| Cambiar configuración global | Sí | No |
| Gestionar roles de moderadores | Sí | No |

## 5.5 Gestión de Comunidades

- Lista con buscador y filtros por tipo oficial o no oficial
- Acciones: editar comunidad, promover a oficial, degradar a no oficial, silenciar comunidad completa, eliminar comunidad
- Sección de solicitudes de promoción a oficial: comunidades que alcanzaron el umbral, con sus estadísticas y botones aprobar o rechazar con campo de razón

## 5.6 Moderación de Contenido

- Contador de reportes pendientes sin revisar
- Filtros: todos, comentarios reportados, posts reportados, usuarios reportados
- Acciones: ver contenido en contexto completo, desestimar reporte, eliminar contenido, advertir al usuario, banear al usuario directamente desde el reporte

## 5.7 Configuración Global de Anuncios

- Anuncio de inicio global: toggle general, minuto predeterminado configurable, duración máxima configurable
- Anuncio de fin o ending global: toggle general, disparador predeterminado configurable
- Anuncio en feed: toggle general, frecuencia configurable en número de posts entre anuncios
- Todos los valores globales pueden sobreescribirse individualmente por episodio

## 5.8 Estadísticas

- Filtro de período: hoy, esta semana, este mes, este año
- Métricas generales: visitas totales, usuarios únicos, páginas vistas, tiempo promedio en el sitio, tasa de rebote
- Estadísticas de anime: top 10 más vistos, episodios más vistos, géneros más populares
- Estadísticas de comunidades: más activas, con más nuevos miembros, más posts del período
- Estadísticas de usuarios: registros por día en gráfica, usuarios activos diarios, tasa de retención
- Estadísticas de anuncios: impresiones totales, clicks totales, CTR

## 5.9 Configuración General del Sitio

- Datos del sitio: nombre, descripción para SEO, logo, favicon
- Opciones de registro: toggle permitir nuevos registros, toggle requerir verificación de email, toggle permitir login con Google y Discord
- SEO: meta título predeterminado, meta descripción predeterminada, ID de Google Analytics
- Modo mantenimiento: toggle que muestra página de mantenimiento a todos excepto al owner, con mensaje personalizable

---

# 6. Plan de Desarrollo por Fases

## Fase 1 — Producto Mínimo Viable (Meses 1 a 4)

- Reproductor de anime con embeds de terceros
- Catálogo de anime con información importada de MAL o AniList
- Sistema de usuario: registro con Google, Discord y email
- Perfil de usuario con lista personal y estados de anime
- Chat por episodio anclado al minuto
- Feed de comunidades con posts de texto e imágenes vía Imgur
- Comunidades creadas por usuarios con tipos oficial y no oficial
- Sistema de gamificación básico: XP, rangos y logros
- Panel de administración completo
- Configuración de anuncios por episodio
- SEO desde el primer día

## Fase 2 — Expansión Social (Meses 5 a 9)

- Mensajes directos entre usuarios
- Rangos personalizados por comunidad estilo Discord
- Panel rápido de notificaciones desde el header
- Exportar lista personal de anime
- Idioma inglés como segunda opción
- Apertura de secciones Manga, Manhwa y Juegos

## Fase 3 — Escala (Mes 10 en adelante)

- Algoritmo de recomendaciones basado en historial del usuario
- Aplicación móvil
- API pública para desarrolladores
- Programa de moderadores comunitarios remunerados

---

# 7. Estructura de URLs

| Pantalla | URL |
|---|---|
| Home | kuroshi.tv |
| Catálogo de anime | kuroshi.tv/anime |
| Página de un anime | kuroshi.tv/anime/nombre-del-anime |
| Reproductor de episodio | kuroshi.tv/anime/nombre-del-anime/episodio-14 |
| Perfil de usuario | kuroshi.tv/u/nombre-de-usuario |
| Lista personal | kuroshi.tv/u/nombre-de-usuario/lista |
| Explorar comunidades | kuroshi.tv/comunidades |
| Comunidad individual | kuroshi.tv/comunidad/nombre-de-la-comunidad |
| Búsqueda | kuroshi.tv/buscar?q=termino |
| Notificaciones | kuroshi.tv/notificaciones |
| Configuración | kuroshi.tv/configuracion |
| Panel de administración | kuroshi.tv/admin |

---

# 8. Stack Tecnológico e Infraestructura Definitiva

## 8.1 Resumen del Stack Completo

| Componente | Tecnología | Alojamiento | Costo |
|---|---|---|---|
| Frontend | Next.js + Tailwind CSS | Hetzner VPS | $0 adicional |
| Backend | NestJS | Hetzner VPS | $0 adicional |
| Base de datos | PostgreSQL | Hetzner VPS (self-hosted) | $0 adicional |
| Capa de datos / Realtime | Supabase self-hosted | Hetzner VPS | $0 adicional |
| ORM | Prisma | Dentro del backend | $0 |
| Autenticación | NextAuth.js | Dentro del frontend | $0 |
| Chat en tiempo real | Supabase Realtime | Hetzner VPS | $0 adicional |
| Imágenes de usuario | Imgur API | Servidores de Imgur | $0 |
| Video (embeds) | Streamtape / Filemoon / YourUpload | Servidores externos | $0 |
| CDN y aceleración LATAM | Cloudflare (tier gratuito) | Red global Cloudflare | $0 |
| SSL / HTTPS | Cloudflare (automático) | Red global Cloudflare | $0 |
| Intermediario web | Nginx | Hetzner VPS | $0 adicional |
| Dominio | kuroshi.tv | Porkbun o Namecheap | ~$2.50/mes |
| Servidor VPS | Hetzner CX22 | Hetzner (Europa) | $4.90/mes |

## 8.2 Detalle de Cada Tecnología

### Frontend — Next.js + Tailwind CSS

- Next.js permite generar páginas estáticas y dinámicas. Cada URL de anime y episodio es indexable por Google, generando tráfico orgánico permanente y gratuito
- El routing por carpetas de Next.js produce naturalmente la estructura de URLs definida en la sección 7
- Next.js precarga las páginas siguientes mientras el usuario navega, logrando tiempos de navegación interna de 200ms a 400ms
- Tailwind CSS para estilos: rápido de escribir, resultado limpio y liviano

### Backend — NestJS

- NestJS es Express con estructura organizada por módulos desde el inicio
- Se elige sobre Express simple porque la arquitectura modular previene el caos cuando el proyecto escala
- Cada dominio del negocio tiene su propio módulo: módulo de anime, módulo de usuarios, módulo de comunidades, módulo de chat, etc.

### Base de Datos — PostgreSQL vía Supabase Self-Hosted

- PostgreSQL maneja perfectamente las relaciones complejas del proyecto: usuarios, animes, episodios, comunidades, posts, comentarios, amigos
- Supabase es software open source que se instala sobre PostgreSQL y añade: panel visual para administrar tablas, Realtime para el chat, y API REST automática
- Al instalarlo en el propio VPS de Hetzner se elimina completamente el pago mensual a Supabase.com
- Prisma como ORM conecta NestJS con PostgreSQL con autocompletado, migraciones y errores legibles

### CDN y Aceleración — Cloudflare Tier Gratuito

- Cloudflare tiene centros de datos en Bogotá, Sao Paulo, Buenos Aires, Ciudad de México y otras ciudades LATAM
- El contenido estático se cachea en el servidor Cloudflare más cercano al usuario
- El ancho de banda del CDN es ilimitado en el tier gratuito sin cobros por GB
- Incluye protección DDoS ilimitada, SSL automático y firewall básico

## 8.3 Arquitectura de Alojamiento

| Servicio | Puerto interno | Descripción |
|---|---|---|
| Next.js (frontend) | 3000 | Sirve la interfaz web |
| NestJS (backend) | 4000 | API REST y lógica de negocio |
| PostgreSQL | 5432 | Base de datos principal |
| Supabase Studio | 8000 | Panel visual de administración de BD |
| Nginx | 80 / 443 | Recibe tráfico externo y distribuye internamente |

## 8.4 Flujo de una Petición de Usuario

1. El usuario escribe kuroshi.tv en su navegador
2. El DNS de Porkbun apunta a Cloudflare
3. Cloudflare verifica si tiene la página en cache en su servidor más cercano al usuario en LATAM
4. Si está en cache la sirve directamente desde LATAM: tiempo de respuesta 50ms a 100ms
5. Si no está en cache Cloudflare la solicita al VPS de Hetzner en Europa
6. Nginx en el VPS recibe la solicitud y la dirige a Next.js o NestJS según corresponda
7. La respuesta vuelve a Cloudflare, se cachea para futuras solicitudes y se entrega al usuario

**Tiempo de carga primera visita:** 2 a 3 segundos. **Visitas siguientes:** 0.8 a 1.2 segundos

## 8.5 Velocidad Estimada vs Competencia

| Plataforma | Carga inicial estimada | Observación |
|---|---|---|
| JKAnime (actual) | 3 a 5 segundos | Sin CDN optimizado para LATAM |
| AnimeFLV (actual) | 4 a 6 segundos | Carga pesada de anuncios |
| Kuroshi.tv primera visita | 2 a 3 segundos | Con Cloudflare CDN |
| Kuroshi.tv visitas siguientes | 0.8 a 1.2 segundos | Contenido cacheado en LATAM |
| Navegación interna Kuroshi | 200ms a 400ms | Next.js precarga páginas |

## 8.6 Costo Mensual Definitivo

| Servicio | Empresa | Costo Mensual |
|---|---|---|
| VPS CX22 (2 CPU, 4GB RAM, 40GB SSD) | Hetzner | $4.90 USD |
| Dominio kuroshi.tv | Porkbun | ~$2.50 USD (pago anual ~$30) |
| CDN + SSL + DDoS | Cloudflare | $0 |
| Base de datos + Realtime | Supabase self-hosted en VPS | $0 |
| Almacenamiento de imágenes | Imgur API | $0 |
| Hosting de video | Streamtape / Filemoon | $0 |
| **TOTAL** | | **$7.40 USD/mes** |

Con un presupuesto inicial de 40 dólares el proyecto tiene aproximadamente 5 meses de runway antes de necesitar ingresos adicionales.

## 8.7 Ruta de Escalamiento

| Etapa | Cuándo escalar | Acción | Costo nuevo |
|---|---|---|---|
| VPS insuficiente | CPU o RAM al límite | Upgrade a Hetzner CX32 (4 CPU, 8GB RAM) | $8.90/mes |
| Supabase gratuito limitante | Si se quisiera migrar fuera del VPS | Supabase.com Plan Pro | $25/mes adicional |
| Necesidad de CDN avanzado | Millones de visitas mensuales | Cloudflare Pro | $20/mes adicional |
| Múltiples servidores | Tráfico muy alto | Segundo VPS Hetzner + balanceador | $4.90/mes adicional |

---

# 9. Resumen Ejecutivo

Kuroshi.tv es una plataforma de streaming de anime con red social integrada, diseñada para el mercado latinoamericano hispanohablante. Su propuesta diferencial frente a competidores como JKAnime y AnimeFLV es la comunidad activa dentro del propio sitio, eliminando la necesidad de plataformas externas.

El proyecto arranca con un presupuesto de aproximadamente 15 dólares mensuales gracias al modelo de video por embed, almacenamiento de imágenes vía Imgur y chat en tiempo real con tiers gratuitos. La monetización es exclusivamente publicitaria con formatos no intrusivos, con meta de ingresos equivalentes a un salario básico una vez alcanzadas las 500 mil visitas mensuales.

Las características diferenciadoras son el chat por episodio anclado al minuto exacto del video que simula la experiencia de ver un stream en compañía, el sistema de comunidades con progresión de no oficial a oficial que incentiva el crecimiento orgánico, y la identidad de otaku personalizable con logros, rangos y perfil temático automático basado en el anime favorito del usuario.

---

*Kuroshi.tv — Versión 1.1 — Junio 2026*
*Confidencial — Uso Interno*
