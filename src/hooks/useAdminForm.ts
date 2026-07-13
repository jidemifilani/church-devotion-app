import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/database';

type TableName = keyof Database['public']['Tables'];
type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

type Options<T extends TableName> = {
  beforeSave?: (values: Partial<Row<T>>) => Partial<Row<T>> | Promise<Partial<Row<T>>>;
  afterSave?: (row: Row<T>) => void | Promise<void>;
  validate?: (values: Partial<Row<T>>) => string | null;
};

/** id === 'new' creates a row; any other id loads and edits that row. */
export function useAdminForm<T extends TableName>(table: T, id: string, defaults: Insert<T>, options?: Options<T>) {
  const { profile } = useAuth();
  const isNew = id === 'new';
  const [values, setValues] = useState<Partial<Row<T>>>(defaults as Partial<Row<T>>);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isNew) {
        setValues(defaults as Partial<Row<T>>);
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      (supabase.from(table) as any)
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }: { data: Row<T> | null }) => {
          if (!active) return;
          if (data) setValues(data);
          setLoading(false);
        });
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, id, isNew])
  );

  const setValue = <K extends keyof Row<T>>(key: K, value: Row<T>[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const save = async (): Promise<{ error: string | null }> => {
    const validationError = options?.validate?.(values);
    if (validationError) return { error: validationError };

    setSaving(true);
    let payload: Record<string, unknown> = options?.beforeSave ? await options.beforeSave(values) : values;
    if (isNew) {
      payload = { ...payload, created_by: profile?.id };
    }

    const query = isNew
      ? (supabase.from(table) as any).insert(payload).select().single()
      : (supabase.from(table) as any).update(payload).eq('id', id).select().single();

    const { data, error } = await query;
    setSaving(false);
    if (error) return { error: error.message };
    if (data && options?.afterSave) await options.afterSave(data as Row<T>);
    return { error: null };
  };

  const remove = async (): Promise<{ error: string | null }> => {
    if (isNew) return { error: null };
    const { error } = await (supabase.from(table) as any).delete().eq('id', id);
    return { error: error?.message ?? null };
  };

  return { values, setValue, isNew, loading, saving, save, remove };
}
