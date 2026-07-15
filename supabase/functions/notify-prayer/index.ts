// Notifies a prayer request's owner (via Expo push) when someone else prays
// for it. Called from the client after inserting a prayer_interactions row.
// Deploy with: supabase functions deploy notify-prayer
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { prayer_request_id } = await req.json();
    if (!prayer_request_id) {
      return new Response(JSON.stringify({ error: 'prayer_request_id is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    // identify the caller from their auth token, to skip self-notification
    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await callerClient.auth.getUser();

    // service role client bypasses RLS to read the owner's push tokens
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: request } = await adminClient
      .from('prayer_requests')
      .select('user_id, content')
      .eq('id', prayer_request_id)
      .single();

    if (!request || request.user_id === user?.id) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: tokens } = await adminClient.from('push_tokens').select('token').eq('user_id', request.user_id);

    if (tokens && tokens.length > 0) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(
          tokens.map((t: { token: string }) => ({
            to: t.token,
            title: 'Someone is praying for you 🙏',
            body: request.content.slice(0, 80),
          }))
        ),
      });
    }

    return new Response(JSON.stringify({ ok: true, notified: tokens?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
