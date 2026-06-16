module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email } = req.body || {};

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const API_KEY = process.env.CONVERTKIT_API_KEY;
    const FORM_ID = process.env.CONVERTKIT_FORM_ID;

    try {
        const response = await fetch(`https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: API_KEY,
                email,
                first_name: name || '',
            }),
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true });
        }

        console.error('ConvertKit error:', data);
        return res.status(400).json({ error: data.message || 'Subscription failed' });
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
