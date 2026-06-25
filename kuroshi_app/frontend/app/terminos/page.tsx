import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de Kuroshi.lat.',
  alternates: { canonical: '/terminos' },
}

export default function TerminosPage() {
  return (
    <div className="legal-page">
      <article className="legal-container">
        <h1 className="legal-title">Términos y Condiciones</h1>
        <p className="legal-date">Última actualización: 16 de junio de 2026</p>

        <section className="legal-section">
          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder o utilizar Kuroshi.lat (en adelante, &laquo;la Plataforma&raquo;),
            usted acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo
            con alguna parte, no debe utilizar nuestros servicios.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Descripción del Servicio</h2>
          <p>
            Kuroshi.lat es una plataforma comunitaria que permite a los usuarios
            descubrir, organizar y compartir enlaces a contenido audiovisual alojado
            exclusivamente en servidores de terceros. <strong>La Plataforma no almacena,
            sube, transmite ni distribuye archivos de video en sus propios servidores.</strong>
            Todo el contenido al que se accede a través de los enlaces es propiedad de
            sus respectivos titulares.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Elegibilidad</h2>
          <p>
            Para utilizar la Plataforma, usted declara tener al menos 13 años de edad.
            Si es menor de 18 años, debe contar con el consentimiento de sus padres o
            tutor legal. El uso de la Plataforma está prohibido en jurisdicciones donde
            el acceso a este tipo de servicios sea ilegal.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Registro y Cuenta</h2>
          <p>Al crear una cuenta, usted es responsable de:</p>
          <ul className="legal-list">
            <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
            <li>Todas las actividades que ocurran bajo su cuenta.</li>
            <li>Proporcionar información precisa y actualizada.</li>
          </ul>
          <p>
            Nos reservamos el derecho de suspender o cancelar cuentas que violen estos
            términos o que sean utilizadas para actividades ilícitas.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Conducta del Usuario</h2>
          <p>Usted se compromete a no utilizar la Plataforma para:</p>
          <ul className="legal-list">
            <li>Publicar enlaces a contenido que infrinja derechos de autor.</li>
            <li>Distribuir malware, virus o cualquier código dañino.</li>
            <li>Realizar actividades fraudulentas o engañosas.</li>
            <li>Acosar, intimidar o dañar a otros usuarios.</li>
            <li>Intentar acceder sin autorización a sistemas o cuentas ajenas.</li>
            <li>Evasir sistemas de monetización o publicidad de la Plataforma.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Contenido Generado por el Usuario</h2>
          <p>
            Los usuarios pueden publicar enlaces, comentarios y otro contenido en la
            Plataforma. Usted retiene todos los derechos sobre su contenido, pero nos
            otorga una licencia para mostrarlo en la Plataforma. Usted es el único
            responsable del contenido que publica y garantiza que tiene derecho a
            compartirlo.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Enlaces a Terceros</h2>
          <p>
            La Plataforma contiene enlaces a sitios web y servidores de terceros que
            no son operados ni controlados por Kuroshi.lat. No somos responsables del
            contenido, las políticas de privacidad o las prácticas de dichos terceros.
            El acceso a sitios de terceros es bajo su propio riesgo.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Derechos de Autor y DMCA</h2>
          <p>
            Kuroshi.lat respeta los derechos de propiedad intelectual. Si usted es
            titular de derechos y considera que algún enlace en nuestra plataforma
            infringe sus derechos, sírvase consultar nuestra{' '}
            <a href="/dmca" className="legal-inline-link">página DMCA</a> para
            instrucciones sobre cómo presentar una notificación de infracción.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Limitación de Responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley, Kuroshi.lat no será responsable
            por daños indirectos, incidentales, especiales o consecuentes derivados del
            uso o la imposibilidad de uso de la Plataforma. La Plataforma se proporciona
            &laquo;tal cual&raquo; sin garantías de ningún tipo.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento.
            Los cambios serán publicados en esta página con una fecha de actualización
            revisada. El uso continuado de la Plataforma después de los cambios constituye
            la aceptación de los nuevos términos.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Ley Aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de los <strong>Estados Unidos Mexicanos</strong>.
            Cualquier disputa relacionada con estos términos será resuelta en los tribunales
            de la Ciudad de México.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Contacto</h2>
          <p>
            Si tiene preguntas sobre estos términos, puede contactarnos a través de
            nuestra <a href="/contacto" className="legal-inline-link">página de contacto</a>.
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
          margin: 0;
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
