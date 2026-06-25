import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de Kuroshi.lat. Conoce cómo manejamos tus datos.',
  alternates: { canonical: '/privacidad' },
}

export default function PrivacidadPage() {
  return (
    <div className="legal-page">
      <article className="legal-container">
        <h1 className="legal-title">Política de Privacidad</h1>
        <p className="legal-date">Última actualización: 16 de junio de 2026</p>

        <section className="legal-section">
          <h2>1. Responsable del Tratamiento</h2>
          <p>
            Kuroshi.lat es responsable del tratamiento de sus datos personales. Si tiene
            alguna pregunta sobre esta política, puede contactarnos a través de{' '}
            <a href="/contacto" className="legal-inline-link">nuestra página de contacto</a>.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Datos que Recopilamos</h2>
          <p>Podemos recopilar la siguiente información cuando utiliza la Plataforma:</p>

          <h3>2.1 Información que usted nos proporciona</h3>
          <ul className="legal-list">
            <li><strong>Datos de registro:</strong> nombre de usuario, dirección de correo electrónico y contraseña (almacenada de forma segura mediante hash).</li>
            <li><strong>Información del perfil:</strong> avatar, biografía, redes sociales y preferencias que usted decida compartir.</li>
            <li><strong>Contenido generado:</strong> comentarios, publicaciones en comunidades, listas de anime y mensajes en chat.</li>
          </ul>

          <h3>2.2 Información recopilada automáticamente</h3>
          <ul className="legal-list">
            <li><strong>Datos de uso:</strong> páginas visitadas, episodios vistos, interacciones y preferencias de navegación.</li>
            <li><strong>Datos del dispositivo:</strong> dirección IP, tipo de navegador, sistema operativo e idioma.</li>
            <li><strong>Cookies y tecnologías similares:</strong> utilizamos cookies para mantener su sesión activa y recordar preferencias.</li>
          </ul>

          <h3>2.3 Información de terceros</h3>
          <ul className="legal-list">
            <li><strong>Autenticación social:</strong> si se registra con Google o Discord, recibimos su nombre, correo electrónico e ID de la plataforma.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Finalidad del Tratamiento</h2>
          <p>Sus datos se utilizan para:</p>
          <ul className="legal-list">
            <li>Proporcionar y mantener la funcionalidad de la Plataforma.</li>
            <li>Permitir la creación y gestión de su cuenta de usuario.</li>
            <li>Personalizar su experiencia y recomendar contenido.</li>
            <li>Moderar contenido y prevenir abusos o violaciones de nuestros términos.</li>
            <li>Enviar comunicaciones relacionadas con el servicio (no publicitarias).</li>
            <li>Cumplir con obligaciones legales y responder a solicitudes DMCA.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Base Legal</h2>
          <p>
            El tratamiento de sus datos se basa en el <strong>consentimiento</strong> que
            nos otorga al registrarse y aceptar nuestra política, así como en la
            <strong>ejecución del servicio</strong> solicitado. Para datos sensibles o
            menores de edad, requerimos consentimiento explícito adicional.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Compartición de Datos</h2>
          <p>No vendemos su información personal a terceros. Podemos compartir datos con:</p>
          <ul className="legal-list">
            <li>
              <strong>Proveedores de servicios:</strong> servicios de hosting (Vercel),
              base de datos, autenticación (NextAuth) y análisis básico.
            </li>
            <li>
              <strong>Autoridades legales:</strong> cuando sea requerido por ley o para
              proteger nuestros derechos legales, incluyendo responder a notificaciones
              DMCA válidas.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Almacenamiento y Seguridad</h2>
          <p>
            Sus datos se almacenan en servidores seguros con cifrado en tránsito (TLS) y
            en reposo. Implementamos medidas técnicas y organizativas para proteger su
            información contra acceso no autorizado, pérdida o alteración. Sus contraseñas
            se almacenan utilizando algoritmos de hash seguros (bcrypt) y nunca en texto
            plano.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Conservación de Datos</h2>
          <p>
            Conservamos sus datos mientras su cuenta esté activa. Si elimina su cuenta,
            sus datos personales se eliminan en un plazo de 30 días. Los datos de
            contenido público (comentarios en comunidades) pueden conservarse de forma
            anónima. Los registros de actividad se conservan hasta 12 meses para fines
            de seguridad.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Sus Derechos</h2>
          <p>Usted tiene derecho a:</p>
          <ul className="legal-list">
            <li><strong>Acceder</strong> a sus datos personales.</li>
            <li><strong>Rectificar</strong> datos inexactos o incompletos.</li>
            <li><strong>Solicitar la eliminación</strong> de sus datos (derecho al olvido).</li>
            <li><strong>Oponerse</strong> al tratamiento de sus datos para fines específicos.</li>
            <li><strong>Portar</strong> sus datos a otro servicio.</li>
            <li><strong>Retirar su consentimiento</strong> en cualquier momento.</li>
          </ul>
          <p>
            Para ejercer estos derechos, contacte a través de{' '}
            <a href="/contacto" className="legal-inline-link">nuestra página de contacto</a>.
            Responderemos dentro de los 30 días hábiles siguientes a su solicitud.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Cookies</h2>
          <p>
            Utilizamos cookies esenciales para el funcionamiento de la Plataforma
            (sesión de usuario, preferencias). No utilizamos cookies de rastreo
            publicitario de terceros. Puede deshabilitar las cookies desde la
            configuración de su navegador, aunque algunas funciones podrían verse
            afectadas.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Enlaces a Terceros</h2>
          <p>
            La Plataforma contiene enlaces a sitios web de terceros (servidores de
            video, redes sociales). No somos responsables de las prácticas de
            privacidad de dichos sitios. Le recomendamos revisar sus políticas de
            privacidad antes de proporcionarles información.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Privacidad de Menores</h2>
          <p>
            La Plataforma no está dirigida a menores de 13 años. Si tenemos
            conocimiento de que hemos recopilado datos de un menor sin
            consentimiento parental, eliminaremos dicha información de inmediato.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Cambios en esta Política</h2>
          <p>
            Podemos actualizar esta política periódicamente. Los cambios se
            publicarán en esta página con una nueva fecha de actualización.
            Le recomendamos revisar esta página regularmente.
          </p>
        </section>
      </article>

      <style>{`
        .legal-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }

        .legal-container {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .legal-title {
          font-family: var(--font-syne);
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.2;
        }

        .legal-date {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: -1rem 0 0;
        }

        .legal-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .legal-section h2 {
          font-family: var(--font-syne);
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 1rem 0 0;
        }

        .legal-section h3 {
          font-family: var(--font-syne);
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0.5rem 0 0;
        }

        .legal-section p {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.75;
          margin: 0;
        }

        .legal-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin: 0;
          padding-left: 1.25rem;
        }

        .legal-list li {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .legal-inline-link {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }
        .legal-inline-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .legal-page { padding: 2rem 1rem 4rem; }
        }
      `}</style>
    </div>
  )
}
