import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export const metadata: Metadata = {
  title: 'DMCA',
  description: 'Política de derechos de autor y procedimiento de aviso DMCA de Kuroshi.lat.',
  alternates: { canonical: '/dmca' },
  openGraph: {
    title: 'DMCA | Kuroshi.lat',
    description: 'Política de derechos de autor y procedimiento de aviso DMCA de Kuroshi.lat.',
    url: `${BASE_URL}/dmca`,
  },
}

export default function DmcaPage() {
  return (
    <div className="legal-page">
      <article className="legal-container">
        <h1 className="legal-title">Política de Derechos de Autor (DMCA)</h1>
        <p className="legal-date">Última actualización: 16 de junio de 2026</p>

        <section className="legal-section">
          <h2>1. Designación de Agente DMCA</h2>
          <p>
            Kuroshi.lat respeta los derechos de propiedad intelectual de terceros y cumple con
            la&nbsp;<strong>Digital Millennium Copyright Act (DMCA)</strong>&nbsp;de los Estados Unidos
            y con la&nbsp;<strong>Ley Federal de Derechos de Autor</strong>&nbsp;de los Estados Unidos
            Mexicanos. Hemos designado un agente para recibir notificaciones de presunta infracción:
          </p>
          <div className="legal-contact-block">
            <p><strong>Agente DMCA:</strong> Kuroshi.lat Compliance</p>
            <p><strong>Correo electrónico:</strong> dmca@kuroshi.lat</p>
            <p><strong>Tiempo de respuesta:</strong> 24–72 horas hábiles</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. Naturaleza del Servicio</h2>
          <p>
            Kuroshi.lat es una plataforma comunitaria que permite a los usuarios compartir y
            organizar enlaces a contenido de video alojado exclusivamente en servidores de terceros
            (<strong>Kuroshi.lat no almacena, copia ni distribuye archivos de video en sus propios servidores</strong>).
            Todo el contenido multimedia al que se accede a través de nuestra plataforma es
            propiedad de sus respectivos titulares y se reproduce únicamente con fines de
            organización y referencia.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Presentar un Aviso de Infracción (Takedown Notice)</h2>
          <p>
            Si usted es el titular de los derechos de autor de algún material disponible en
            Kuroshi.lat y considera que dicho material infringe sus derechos, sírvase enviar
            una notificación por escrito a nuestro agente DMCA que incluya la siguiente información:
          </p>
          <ol className="legal-list">
            <li>
              <strong>Firma física o electrónica</strong> del titular de los derechos o de su
              representante autorizado.
            </li>
            <li>
              <strong>Identificación de la obra protegida</strong> que se alega infringida, o,
              si múltiples obras están cubiertas por una sola notificación, una lista
              representativa de dichas obras.
            </li>
            <li>
              <strong>Identificación del material infractor</strong> y la información
              suficiente para localizarlo (URL exacta del episodio o página donde aparece el
              enlace denunciado).
            </li>
            <li>
              Información de contacto suficiente para comunicarnos con usted: <strong>nombre,
              dirección, número de teléfono y correo electrónico</strong>.
            </li>
            <li>
              Una declaración de que usted <strong>cree de buena fe</strong> que el uso del
              material no está autorizado por el titular de los derechos, su agente o la ley.
            </li>
            <li>
              Una declaración, bajo pena de perjurio, de que la información en la notificación
              es <strong>precisa</strong> y que usted está autorizado a actuar en nombre del
              titular de los derechos.
            </li>
          </ol>
          <p className="legal-warning">
            <strong>Importante:</strong> El envío de una notificación falsa o engañosa puede
            resultar en responsabilidad legal. Recomendamos consultar con un abogado antes de
            presentar una notificación DMCA.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Procedimiento ante un Aviso Válido</h2>
          <p>
            Al recibir una notificación que cumpla con los requisitos de la DMCA, actuaremos
            de inmediato para:
          </p>
          <ul className="legal-list">
            <li>Retirar o deshabilitar el acceso al material presuntamente infractor.</li>
            <li>Notificar al usuario que publicó el enlace sobre la eliminación.</li>
            <li>Mantener un registro de la notificación para fines de cumplimiento.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Contra-notificación (Counter-Notice)</h2>
          <p>
            Si usted es un usuario cuyo material fue eliminido por error o identificación
            equivocada, puede enviar una contra-notificación a nuestro agente DMCA con la
            siguiente información:
          </p>
          <ol className="legal-list">
            <li>Su firma física o electrónica.</li>
            <li>
              Identificación del material eliminado y la ubicación donde aparecía antes de
              ser eliminado.
            </li>
            <li>
              Una declaración, bajo pena de perjurio, de que usted <strong>cree de buena fe</strong>
              que el material fue eliminado como resultado de un error o identificación
              equivocada.
            </li>
            <li>
              Su nombre, dirección y número de teléfono, y una declaración de que acepta la
              jurisdicción del tribunal federal de su distrito.
            </li>
          </ol>
          <p>
            Si recibimos una contra-notificación válida, la reenviaremos a la parte que
            presentó la notificación original. Si dicha parte no presenta una acción legal
            dentro de los 10 días hábiles, podemos restaurar el material.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Política de Infractores Reincidentes</h2>
          <p>
            Kuroshi.lat se reserva el derecho, a su sola discreción, de terminar las cuentas
            de aquellos usuarios que sean considerados <strong>infractores reincidentes</strong>.
            Se considerará infractor reincidente a cualquier usuario que haya sido objeto de
            tres o más notificaciones DMCA válidas.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Limitación de Responsabilidad</h2>
          <p>
            Kuroshi.lat actúa como un <strong>intermediario pasivo</strong> que proporciona
            una plataforma para la organización de enlaces generados por usuarios. No
            controlamos, revisamos ni aprobamos previamente el contenido alojado en servidores
            de terceros. Cumpliremos de buena fe con todas las notificaciones DMCA válidas
            que recibamos.
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

        .legal-contact-block {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .legal-contact-block p {
          font-size: 0.9375rem;
          color: var(--text-secondary);
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

        .legal-warning {
          background: rgba(230, 57, 70, 0.08);
          border-left: 3px solid var(--accent);
          padding: 0.75rem 1rem;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          font-size: 0.875rem !important;
          color: var(--text-secondary) !important;
        }

        @media (max-width: 640px) {
          .legal-page { padding: 2rem 1rem 4rem; }
        }
      `}</style>
    </div>
  )
}
