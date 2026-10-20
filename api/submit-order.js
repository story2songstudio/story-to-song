// Keep form delivery on the site's server; never redirect on an unconfirmed send.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Please submit the order form.' });
  }
  const origin = req.headers.origin;
  if (origin !== 'https://story-to-song-1.vercel.app') {
    return res.status(403).json({ success: false, message: 'Please use the order form on our website.' });
  }
  let data;
  try { data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (_) { return res.status(400).json({ success: false, message: 'Invalid order.' }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ success: false, message: 'Invalid order.' });
  }
  if (JSON.stringify(data).length > 64000) {
    return res.status(413).json({ success: false, message: 'Please shorten your story.' });
  }
  const required = ['Name', 'Email', 'Occasion', 'Song for', 'Story'];
  if (required.some(key => typeof data[key] !== 'string' || !data[key].trim()) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) {
    return res.status(400).json({ success: false, message: 'Please complete the required fields and email address.' });
  }
  const allowed = ['Name', 'Email', 'Occasion', 'Other occasion', 'Song for', 'Song from', 'Name pronunciation', 'Music style', 'Mood', 'Story', 'Must include', 'Main message', 'Topics to avoid', 'Other style requests', 'Voice', 'Emotion'];
  const payload = { _subject: 'New Story to Song Request', _template: 'table' };
  for (const key of allowed) if (typeof data[key] === 'string') payload[key] = data[key];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const upstream = await fetch('https://formsubmit.co/ajax/story2songstudio@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const result = await upstream.json();
    if (!upstream.ok || (result.success !== true && result.success !== 'true')) {
      return res.status(502).json({ success: false, message: 'The story service did not confirm delivery. Your details are still on this page.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(504).json({ success: false, message: error.name === 'AbortError' ? 'The story service timed out. Your details are still on this page.' : 'The story service could not be reached. Your details are still on this page.' });
  } finally { clearTimeout(timer); }
};
module.exports.config = { maxDuration: 30 };
