import { Resend } from 'resend';
import config from '../src/config/env.config';

const resend = new Resend(config.RESEND_API_KEY);

(async function () {
    const { data, error } = await resend.emails.send({
        from: 'Winter Land <no_reply@winterland-alain.ae>',
        to: ['khaled18saeed@gmail.com'],
        subject: 'Winter Land | Welcome Email',
        html: "<h1>Welcome to Winter Land!</h1><p>We're excited to have you on board.</p>",
    });

    if (error) {
        return console.error({ error });
    }

    console.log({ data });
})();