// functions/get-favicon.js
export async function onRequestPost(ctx) {
  const { request } = ctx;
  
  try {
    const { url } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: "missing url" }), { status: 400 });
    }

    // 直接使用 Google Favicon 服务（最简单稳定）
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    
    return Response.json({ faviconUrl });
    
  } catch (error) {
    // 返回默认图标
    return Response.json({ 
      faviconUrl: "https://favicon.cc/avatar.png" 
    });
  }
}