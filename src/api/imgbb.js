// Lightweight imgbb uploader (ES module)
// Usage: import { uploadToImgbb } from '../api/imgbb.js'
// const url = await uploadToImgbb(file, 'YOUR_IMGBB_KEY');
export async function uploadToImgbb(file, apiKey, expiration = 600) {
  if (!file) throw new Error('No file provided');
  if (!apiKey) throw new Error('No imgbb API key set');

  const endpoint = `https://api.imgbb.com/1/upload?expiration=${encodeURIComponent(String(expiration))}&key=${encodeURIComponent(apiKey)}`;
  const form = new FormData();
  // imgbb expects the file data as 'image' (can be File or base64). We'll send File directly.
  form.append('image', file);

  const res = await fetch(endpoint, {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    const text = await res.text().catch(()=>res.statusText);
    const err = new Error('imgbb upload failed: ' + res.status + ' ' + text);
    err.status = res.status;
    throw err;
  }

  const body = await res.json();
  if (!body || !body.data || !body.data.url) {
    throw new Error('Unexpected imgbb response: ' + JSON.stringify(body));
  }

  // Returns the public image URL (hosted by imgbb)
  return {
    url: body.data.url,
    display_url: body.data.display_url,
    delete_url: body.data.delete_url,
    raw: body
  };
}
