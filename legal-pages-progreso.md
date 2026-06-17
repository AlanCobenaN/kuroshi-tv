# Progreso - Páginas Legales Kuroshi.lat

## Estado: ✅ Completado (16/06/2026)

### Páginas creadas

| Página | Ruta | Archivo |
|--------|------|---------|
| DMCA | `/dmca` | `frontend/app/dmca/page.tsx` |
| Términos y Condiciones | `/terminos` | `frontend/app/terminos/page.tsx` |
| Política de Privacidad | `/privacidad` | `frontend/app/privacidad/page.tsx` |
| Contacto | `/contacto` | `frontend/app/contacto/page.tsx` |

### Footer actualizado
- `frontend/components/layout/Footer.tsx` — Nueva columna "Legal" con links a las 4 páginas

### Registro actualizado
- `frontend/app/login/LoginForm.tsx` — Checkbox obligatorio de aceptación de Términos y Privacidad

### Detalles legales configurados
- **Jurisdicción:** Estados Unidos Mexicanos (VPS en México)
- **DMCA:** Incluye referencia a DMCA (EEUU) + Ley Federal de Derechos de Autor (México)
- **Contacto emails:** `dmca@kuroshi.lat`, `support@kuroshi.lat`, `privacidad@kuroshi.lat`

---

## Pendientes (hacer tú)

### 1. Correos electrónicos
Crear las cuentas en Gmail y configurar forwarding:
- `dmca.kuroshi@gmail.com` → forwarding desde `dmca@kuroshi.lat`
- `support.kuroshi@gmail.com` → forwarding desde `support@kuroshi.lat`
- `privacidad.kuroshi@gmail.com` → forwarding desde `privacidad@kuroshi.lat`

### 2. WHOIS del dominio
Activar privacidad WHOIS en `kuroshi.lat` para que no aparezcan datos personales.

### 3. Revisar hosting
Verificar que el VPS en México no tenga restricciones ni avisos del ISP sobre contenido.

### 4. Build y deploy
```bash
cd kuroshi_app/frontend
npm run build
# hacer deploy
```

### 5. Commit (cuando esté listo)
```bash
git add -A
git commit -m "feat: add legal pages (DMCA, terms, privacy, contact)"
```

---

## Extra: Protección adicional recomendada
- [ ] Cloudflare delante del VPS (oculta IP real + DDoS protection)
- [ ] Dominio de respaldo (ej. kuroshi.tv, kuroshi.app)
- [ ] No usar AdSense ni servicios publicitarios de EEUU
- [ ] Moderación de contenido reportado como infractor
