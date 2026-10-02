import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function readKeyMap(name: string, prefix: string) {
  try {
    const map = JSON.parse(Deno.env.get(name) || "{}");
    return Object.values(map).find((value) => typeof value === "string" && value.startsWith(prefix)) as string | undefined;
  } catch {
    return undefined;
  }
}

function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") return null;
  const displayName = value.trim().replace(/\s+/g, " ");
  if (displayName.length < 2 || displayName.length > 24 || !/^[\p{L}\p{N} _-]+$/u.test(displayName)) return null;
  const loginKey = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/gi, (letter) => letter === "Ł" ? "L" : "l")
    .toLocaleLowerCase("pl")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return loginKey ? { displayName, loginKey } : null;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Dozwolone jest tylko żądanie POST." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || readKeyMap("SUPABASE_SECRET_KEYS", "sb_secret_");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || readKeyMap("SUPABASE_PUBLISHABLE_KEYS", "sb_publishable_");
  if (!supabaseUrl || !serviceKey || !publishableKey) {
    return json({ error: "Brakuje kluczy Supabase w ustawieniach funkcji." }, 500);
  }

  let body: { action?: string; displayName?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Nieprawidłowe dane." }, 400);
  }

  const identity = normalizeDisplayName(body.displayName);
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!identity || !/^\d{4}$/.test(pin) || !["login", "register"].includes(body.action || "")) {
    return json({ error: "Wpisz imię lub pseudonim oraz PIN składający się z 4 cyfr." }, 400);
  }

  const forwardedIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateKey = await sha256(`${body.action}:${identity.loginKey}:${forwardedIp}`);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: allowed, error: rateError } = await admin.rpc("consume_student_pin_attempt", { p_rate_key: rateKey });
  if (rateError) return json({ error: "Usługa logowania nie jest jeszcze skonfigurowana." }, 503);
  if (!allowed) return json({ error: "Za dużo prób. Odczekaj 15 minut i spróbuj ponownie." }, 429);

  // Limit account creation per network as well as per chosen name to make bulk signup harder.
  const signupIpKey = body.action === "register" ? await sha256(`register-ip:${forwardedIp}`) : null;
  if (signupIpKey) {
    const { data: signupAllowed, error: signupRateError } = await admin.rpc("consume_student_pin_attempt", { p_rate_key: signupIpKey });
    if (signupRateError) return json({ error: "Usługa rejestracji nie jest jeszcze skonfigurowana." }, 503);
    if (!signupAllowed) return json({ error: "Z tego połączenia utworzono już kilka kont. Spróbuj ponownie za 15 minut." }, 429);
  }

  const email = `student-${identity.loginKey}@accounts.invalid`;
  const password = `Iskierka-${pin}`;

  if (body.action === "register") {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: identity.displayName },
    });
    if (createError || !created.user) {
      return json({ error: "Ta nazwa jest już zajęta. Wybierz pseudonim, na przykład z cyfrą." }, 409);
    }
    const { error: profileError } = await admin.from("student_profiles").insert({
      user_id: created.user.id,
      display_name: identity.displayName,
      login_key: identity.loginKey,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: "Nie udało się utworzyć profilu. Wybierz inną nazwę." }, 409);
    }
  }

  const auth = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: signedIn, error: signInError } = await auth.auth.signInWithPassword({ email, password });
  if (signInError || !signedIn.session) {
    return json({ error: body.action === "register" ? "Konto utworzono, ale nie udało się zalogować. Spróbuj się zalogować." : "Imię lub PIN są nieprawidłowe." }, 401);
  }

  if (body.action === "login") await admin.rpc("reset_student_pin_attempt", { p_rate_key: rateKey });
  return json({
    session: {
      access_token: signedIn.session.access_token,
      refresh_token: signedIn.session.refresh_token,
    },
  });
});
