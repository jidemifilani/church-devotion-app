import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type TableName = keyof Database['public']['Tables'];
type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];

type Options = {
  orderBy?: { column: string; ascending?: boolean };
};

/** For parent+children admin entities (e.g. a reading plan and its days). */
export function useAdminChildren<T extends TableName>(
  table: T,
  parentColumn: string,
  parentId: string | null,
  options?: Options
) {
  const [items, setItems] = useState<Row<T>[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!parentId) {
      setItems([]);
      setLoading(false);
      return;
    }
    let query = (supabase.from(table) as any).select('*').eq(parentColumn, parentId);
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }
    const { data } = await query;
    setItems((data as Row<T>[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, parentColumn, parentId, options?.orderBy?.column, options?.orderBy?.ascending]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const add = async (row: Partial<Row<T>>): Promise<{ error: string | null }> => {
    const { error } = await (supabase.from(table) as any).insert({ ...row, [parentColumn]: parentId });
    if (!error) await refetch();
    return { error: error?.message ?? null };
  };

  const remove = async (id: string) => {
    await (supabase.from(table) as any).delete().eq('id', id);
    await refetch();
  };

  return { items, loading, add, remove, refetch };
}
