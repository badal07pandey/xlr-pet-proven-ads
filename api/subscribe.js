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
                ad_spend: revenue || '',
            },
        }),
    });

    const ckData = await ckRes.json();

    if (!ckRes.ok) {
        console.error('ConvertKit error:', ckData);
        return res.status(400).json({ error: ckData.message || 'Subscription failed' });
    }

    // Await Slack so Vercel doesn't cut execution before it fires
    if (SLACK_WEBHOOK) {
        try {
            await fetch(SLACK_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `New lead from *${niche || 'Proven Ads'}*`,
                    attachments: [
                        {
                            color: '#22c55e',
                            title: 'Proven Ads — XLR Media',
                            text: 'A new form submission has been received',
                            fields: [
                                { title: 'Name', value: name || '—', short: false },
                                { title: 'Email', value: email, short: false },
                                { title: 'Niche', value: niche || '—', short: true },
                                { title: 'Ad Spend Level', value: revenue || '—', short: true },
                                { title: 'Phone', value: phone || '—', short: false },
                            ],
                        },
                    ],
                }),
            });
        } catch (err) {
            console.error('Slack error:', err);
        }
    }

    return res.status(200).json({ success: true });
};
