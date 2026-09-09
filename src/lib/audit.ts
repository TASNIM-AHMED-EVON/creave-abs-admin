import { supabase } from '@/lib/supabase';

export type AuditEntry = {
  action: 'edit' | 'void' | 'refund' | 'discount_override' | 'create' | 'restore' | string;
  entityType: string; // e.g. 'dress', 'sale'
  entityId?: string | number | null;
  before?: unknown;
  after?: unknown;
  reason?: string;
  actor?: { id: string; full_name: string } | null; // currently identified staff, if any
  actorAccountRole?: string | null; // the logged-in session's app_metadata.role
  approvedBy?: { id: string; full_name: string } | null; // set when a PIN override was used
};

// Fire-and-forget by design: a failed audit write should never block or
// roll back the mutation it's describing. Errors are logged to console only.
export async function logAudit(entry: AuditEntry): Promise<void> {
  const { error } = await supabase.from('audit_log').insert([{
    actor_staff_id: entry.actor?.id ?? null,
    actor_staff_name: entry.actor?.full_name ?? null,
    actor_account_role: entry.actorAccountRole ?? null,
    approved_by_staff_id: entry.approvedBy?.id ?? null,
    approved_by_staff_name: entry.approvedBy?.full_name ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId != null ? String(entry.entityId) : null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    reason: entry.reason ?? null,
  }]);
  if (error) {
    // Make sure this table exists (see migration_010) without ever throwing
    // out of a POS action because of it.
    console.error('Audit log write failed:', error);
  }
}
