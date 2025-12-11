import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const { url } = await request.json();
  
  if (!url) {
    return new Response(JSON.stringify({ error: "missing url" }), { status: 400 });
  }

  // 提取域名，移除 www. 前缀
  const domain = new URL(url).hostname.replace(/^www\./, '');
  const fileName = `favicons/${domain}.ico`;
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Step 1: 先查数据库是否有缓存
  const { data: existing } = await supabase
    .from("nav_links")
    .select("icon")
    .eq("url", url)
    .maybeSingle();

  if (existing?.icon) {
    return Response.json({ faviconUrl: existing.icon });
  }

  let faviconUrl = null;
  const defaultIcon = "https://favicon.cc/avatar.png";

  // Step 2: 尝试从标准位置获取 favicon
  const possiblePaths = [
    `https://${domain}/favicon.ico`,
    `https://${domain}/favicon.png`,
    `https://www.${domain}/favicon.ico`
  ];

  for (const path of possiblePaths) {
    try {
      const resp = await axios.get(path, {
        responseType: "arraybuffer",
        validateStatus: () => true,
        timeout: 2000
      });
      
      if (resp.status === 200 && resp.data.byteLength > 100) {
        faviconUrl = path;
        break;
      }
    } catch {}
  }

  // Step 3: 从 HTML 的 <link> 标签中查找
  if (!faviconUrl) {
    try {
      const html = await axios.get(`https://${domain}`, { 
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const $ = cheerio.load(html.data);
      
      // 查找各种可能的 favicon 标签
      const icon = $('link[rel="icon"]').attr("href") || 
                   $('link[rel="shortcut icon"]').attr("href") ||
                   $('link[rel="apple-touch-icon"]').attr("href") ||
                   $('link[rel="apple-touch-icon-precomposed"]').attr("href");
      
      if (icon) {
        faviconUrl = new URL(icon, `https://${domain}`).href;
      }
    } catch {}
  }

  // Step 4: 下载并上传到 Supabase Storage
  try {
    const finalUrl = faviconUrl || defaultIcon;
    const iconResp = await axios.get(finalUrl, { 
      responseType: "arraybuffer",
      timeout: 3000,
      validateStatus: () => true
    });

    // 上传到 Supabase Storage
    // ⚠️ 注意：这里要改成你的实际存储桶名称！
    const bucketName = "avatars"; // ← 修改这一行，用你的存储桶名
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, iconResp.data, {
        contentType: iconResp.headers['content-type'] || 'image/x-icon',
        upsert: true,
        cacheControl: '31536000' // 1年缓存
      });

    if (uploadError) {
      console.error("上传错误:", uploadError);
      throw uploadError;
    }

    // 获取公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // 更新数据库
    await supabase
      .from("nav_links")
      .update({ icon: publicUrl })
      .eq("url", url);

    console.log(`图标已保存: ${publicUrl}`);
    return Response.json({ faviconUrl: publicUrl });

  } catch (error) {
    console.error("Favicon 处理错误:", error);
    // 返回默认图标
    return Response.json({ 
      faviconUrl: defaultIcon 
    });
  }
}