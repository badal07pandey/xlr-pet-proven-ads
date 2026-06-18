module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, revenue, formId, niche } = req.body || {};

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const API_KEY = process.env.CONVERTKIT_API_KEY;
    const FORM_ID = formId || process.env.CONVERTKIT_FORM_ID;
    const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

    const ckRes = await fetch(`https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: API_KEY,
            email,
            first_name: name || '',
            fields: {
                phone: phone || '',
                monthly_revenue: revenue || '',
            },
        }),
    });

    const ckData = await ckRes.json();

    if (!ckRes.ok) {
        console.error('ConvertKit error:', ckData);
        return res.status(400).json({ error: ckData.message || 'Subscription failed' });
    }

    if (SLACK_WEBHOOK) {
        fetch(SLACK_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `New lead — *${name || 'Unknown'}*\nEmail: ${email}\nPhone: ${phone || '—'}\nMonthly Revenue: ${revenue || '—'}\nSource: ${niche || 'Unknown'}`,
            }),
        }).catch(err => console.error('Slack error:', err));
    }

    return res.status(200).json({ success: true });
};
