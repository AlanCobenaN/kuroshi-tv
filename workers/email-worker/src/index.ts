export interface Env {
  FROM_NAME: string
  FROM_EMAIL: string
}

interface SendEmailRequest {
  to: string
  subject: string
  htmlContent: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const body: SendEmailRequest = await request.json()

    if (!body.to || !body.subject || !body.htmlContent) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, htmlContent' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const mailChannelsResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sender-Id': `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: body.to }],
          },
        ],
        from: { email: env.FROM_EMAIL, name: env.FROM_NAME },
        subject: body.subject,
        content: [{ type: 'text/html', value: body.htmlContent }],
      }),
    })

    if (!mailChannelsResponse.ok) {
      const errorText = await mailChannelsResponse.text()
      return new Response(JSON.stringify({ error: 'MailChannels error', details: errorText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
