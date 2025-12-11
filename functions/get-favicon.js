import axios from "axios";
import * as cheerio from "cheerio";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

export async function onRequestPost(ctx) {
  const { request, env } = ctx;

  const { url } = await request.json();
  if (!url) {
    return new Response(JSON.stringify({ error: "missing url" }), { status: 400 });
  }

  const domain = new URL(url).hostname;
  const fileName = `${domain}.png`;
  const r2Url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileName}`;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Step 0: 数据库中已有缓存
  const { data: existing } = await supabase
    .from("nav_links")
    .select("icon")
    .eq("url", url)
    .maybeSingle();

  if (existing?.icon) {
    return Response.json({ faviconUrl: existing.icon });
  }

  let faviconUrl = null;

  // Step 1: 标准路径
  try {
    const resp = await axios.get(`https://${domain}/favicon.ico`, {
      responseType: "arraybuffer",
      validateStatus: () => true,
      timeout: 3000,
    });

    if (resp.status === 200 && resp.data.byteLength > 100) {
      faviconUrl = `https://${domain}/favicon.ico`;
    }
  } catch {}

  // Step 2: HTML 中找 icon
  if (!faviconUrl) {
    try {
      const html = await axios.get(url);
      const $ = cheerio.load(html.data);
      const href = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').attr("href");
      if (href) faviconUrl = new URL(href, url).href;
    } catch {}
  }

  // Step 3: 兜底
  if (!faviconUrl) {
    faviconUrl = env.DEFAULT_FAVICON;
  }

  // Step 4: 下载并上传到 R2
  try {
    const iconResp = await axios.get(faviconUrl, { responseType: "arraybuffer" });

    const r2 = new S3Client({
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: "auto",
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY,
        secretAccessKey: env.R2_SECRET_KEY,
      },
    });

    await r2.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: fileName,
        Body: iconResp.data,
        ContentType: "image/png",
      })
    );

    // 写入数据库
    await supabase
      .from("nav_links")
      .update({ icon: r2Url })
      .eq("url", url);

    return Response.json({ faviconUrl: r2Url });

  } catch (e) {
    return Response.json({ faviconUrl: env.DEFAULT_FAVICON });
  }
}
