import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const [, , activityKey, unsplashUrl] = process.argv;

if (!activityKey || !unsplashUrl) {
  console.error("Usage: node scripts/upload-quiz-image.mjs <activity_key> <unsplash_url>");
  process.exit(1);
}

function readEnv(contents) {
  const env = {};
  for (const line of contents.split(/\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function cleanUnsplashImageUrl(rawUrl) {
  const url = new URL(rawUrl);
  return `${url.origin}${url.pathname}?auto=format&fit=crop&w=1200&h=2200&q=85`;
}

async function getDirectImageUrl(photoUrl) {
  const response = await fetch(photoUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Unsplash page: ${response.status}`);
  }
  const html = await response.text();
  const match =
    html.match(/<meta property="og:image" content="([^"]+)"/) ??
    html.match(/<meta name="twitter:image" content="([^"]+)"/);
  if (!match) {
    throw new Error("Could not find an Unsplash image URL on the page");
  }
  return cleanUnsplashImageUrl(match[1].replaceAll("&amp;", "&"));
}

const env = readEnv(await fs.readFile(".env.local", "utf8"));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const imageUrl = await getDirectImageUrl(unsplashUrl);
const imageResponse = await fetch(imageUrl);
if (!imageResponse.ok) {
  throw new Error(`Failed to download image: ${imageResponse.status}`);
}

const image = Buffer.from(await imageResponse.arrayBuffer());
const objectPath = `quiz/${activityKey}.jpg`;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.storage.from("assets").upload(objectPath, image, {
  cacheControl: "31536000",
  contentType: "image/jpeg",
  upsert: true,
});

if (error) throw error;

const { data } = supabase.storage.from("assets").getPublicUrl(objectPath);
console.log(data.publicUrl);
