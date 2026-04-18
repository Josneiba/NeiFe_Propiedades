# 📧 Configuración de Envío de Emails con Resend

## Checklist de Configuración

### 1. ✅ Verificar que RESEND_API_KEY está en .env.local

```bash
# .env.local debe contener:
RESEND_API_KEY="re_LXJawA97_KurcE1KKH75S7A45TbvdL1hm"
RESEND_FROM="invitaciones@neife.cl"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### 2. 🧪 Probar la configuración

Abre en tu navegador:
```
http://localhost:3001/api/test-resend
```

Deberías ver:
- ✅ `"status": "SUCCESS"`
- El ID del email enviado
- Confirmación de configuración

### 3. 📨 Probar invitaciones reales

Ve al dashboard:
1. `/dashboard/propiedades`
2. Selecciona una propiedad
3. Haz clic en "Invitar arrendatario"
4. Ingresa un email (usa tu email de prueba)
5. Selecciona tipo "EMAIL" o "LINK"
6. Haz clic en "Enviar"

### 4. 📋 Verificar logs en consola

En VS Code, abre la terminal y busca:
```
📧 Intentando enviar email de invitación a [email]
✅ Email enviado exitosamente. ID: [id]
```

Si ves errores:
```
❌ Error de Resend: [error message]
```

### 5. 🔍 Problemas comunes

#### No aparece "✅ Email enviado"
- Verifica que RESEND_API_KEY es válida en https://resend.com
- Comprueba que la API key no ha expirado
- Reinicia el servidor de desarrollo: `pnpm run dev`

#### El email no llega
- Revisa la carpeta de SPAM
- Verifica que el dominio está verificado en Resend
- Usa https://resend.com/emails para ver el historial

#### Error "RESEND_API_KEY no configurada"
- Abre `.env.local`
- Asegúrate de que `RESEND_API_KEY="..."` está presente
- Reinicia el servidor

#### Error "operation not permitted"
- Es un issue de Windows con Prisma, no afecta el envío de emails
- Los emails se envían correctamente aunque veas el error de Prisma en build

### 6. 💡 Variables de entorno

**Producción (Vercel):**
1. Ve a https://vercel.com/dashboard
2. Abre tu proyecto NeiFe
3. Settings → Environment Variables
4. Agrega:
   - `RESEND_API_KEY`
   - `RESEND_FROM` (opcional, por defecto es en .env.local)

**Local:**
- Todo debe estar en `.env.local`

### 7. 🔐 Seguridad

- **Nunca** commits tu RESEND_API_KEY en Git
- `.env.local` está en `.gitignore` ✅
- Usa variables de entorno en producción

### 8. 📞 Soporte

Si los emails no funcionan:
1. Ve a `/api/test-resend` en tu navegador
2. Copia toda la respuesta JSON
3. Verifica en https://resend.com/emails que ves la actividad
4. Revisa los logs de la consola del servidor

### Recursos

- Documentación Resend: https://resend.com/docs
- React Email: https://react.email/
- NextAuth + Email: https://next-auth.js.org/providers/email

---

**Estado actual:**
- ✅ Template profesional creado con React Email
- ✅ API actualizado con mejor logging
- ✅ Endpoint de test disponible
- ✅ Variables de entorno configuradas

**Próximos pasos:**
1. Reinicia el servidor: `pnpm run dev`
2. Prueba `/api/test-resend`
3. Si funciona, prueba invitar arrendatarios
4. Revisa los logs en la consola del servidor
