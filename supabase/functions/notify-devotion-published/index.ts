// Notifies all members (via Expo push) when an admin publishes a devotion.
// Called from the client after a devotion's status transitions to 'published'.
// Deploy with: supabase functions deploy notify-devotion-published
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_BATCH_SIZE = 100;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { devotion_id } = await req.json();
    if (!devotion_id) {
      return new Response(JSON.stringify({ error: 'devotion_id is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    // identify the caller from their auth token
    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // service role client bypasses RLS to check the caller's role and read every push token
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: callerProfile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'admins only' }), { status: 403, headers: corsHeaders });
    }

    const { data: devotion } = await adminClient
      .from('devotions')
      .select('devotion_date, title, scripture_reference, status')
      .eq('id', devotion_id)
      .single();

    // only today's devotion should push — bulk-publishing future-dated drafts shouldn't spam members
    const today = new Date().toISOString().slice(0, 10);
    if (!devotion || devotion.status !== 'published' || devotion.devotion_date !== today) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: tokens } = await adminClient.from('push_tokens').select('token');
    const messages = (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: "Today's devotion is ready 📖",
      body: `${devotion.title} — ${devotion.scripture_reference}`,
    }));

    for (let i = 0; i < messages.length; i += EXPO_PUSH_BATCH_SIZE) {
      const batch = messages.slice(i, i + EXPO_PUSH_BATCH_SIZE);
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
    }

    return new Response(JSON.stringify({ ok: true, notified: messages.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
