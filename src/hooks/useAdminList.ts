import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type TableName = keyof Database['public']['Tables'];
type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];

type Options = {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  eq?: Record<string, string | number | boolean>;
};

export function useAdminList<T extends TableName>(table: T, options?: Options) {
  const [items, setItems] = useState<Row<T>[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    let query = supabase.from(table).select(options?.select ?? '*') as any;
    if (options?.eq) {
      for (const [column, value] of Object.entries(options.eq)) {
        query = query.eq(column, value);
      }
    }
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }
    const { data } = await query;
    setItems((data as Row<T>[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, options?.select, options?.orderBy?.column, options?.orderBy?.ascending, JSON.stringify(options?.eq)]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return { items, loading, refetch };
}
