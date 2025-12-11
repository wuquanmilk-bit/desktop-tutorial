export async function onRequestPost(ctx) {
  const { request } = ctx;
  
  try {
    const { url } = await request.json();
    if (!url) return new Response(JSON.stringify({ error: "missing url" }), { status: 400 });

    const domain = new URL(url).hostname.replace(/^www\./, '');
    
    // 国内可用的替代服务（按优先级尝试）
    const services = [
      `https://api.faviconkit.com/${domain}/144`,  // 专业API
      `https://favicon.yandex.net/favicon/${domain}`, // Yandex
      `https://www.google.com/s2/favicons?domain=${domain}`, // Google（备用）
      'https://favicon.cc/avatar.png' // 最终回退
    ];

    return Response.json({ faviconUrl: services[0] });
    
  } catch (error) {
    return Response.json({ faviconUrl: "https://favicon.cc/avatar.png" });
  }
}