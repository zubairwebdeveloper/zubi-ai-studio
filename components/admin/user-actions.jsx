"use client";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/field";
import { setUserStatus, setUserRole, adjustUserCredits } from "@/lib/actions/admin";
import { ASSIGNABLE_ROLES } from "@/lib/admin/permissions";

const inputCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";

function Result({ state }) { return <FormAlert tone={state.ok ? "ok" : "error"}>{state.text}</FormAlert>; }

// Buttons are shown only when the actor is allowed; the server re-checks everything regardless.
export function UserActions({ uid, status, role, canSuspend, canRole, canAdjust, adjustLimit, isSelf }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const [reason, setReason] = useState("");
  const [newRole, setNewRole] = useState(role);
  const [amount, setAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const keyRef = useRef(crypto.randomUUID().replace(/-/g, "")); // one key per form load: a double click cannot apply twice

  const run = (fn, done) => start(async () => {
    setMsg({ ok: true, text: "" });
    const res = await fn();
    setMsg(res.ok ? { ok: true, text: res.duplicate ? "Already applied." : "Saved." } : { ok: false, text: res.error });
    if (res.ok) done?.();
  });

  if (isSelf) return <p className="text-sm text-muted-foreground">This is your own account. Changes to it are blocked here by design.</p>;
  const suspended = status === "suspended";

  return (
    <div className="space-y-8">
      <Result state={msg} />
      {canSuspend && (
        <section aria-labelledby="st-h" className="space-y-3">
          <h3 id="st-h" className="font-semibold">{suspended ? "Account is suspended" : "Suspend account"}</h3>
          <label htmlFor="st-reason" className="block text-sm font-medium">Reason (recorded in the audit log)</label>
          <input id="st-reason" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} disabled={pending} />
          <Button disabled={pending || reason.trim().length < 5} className={suspended ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            onClick={() => run(() => setUserStatus({ uid, status: suspended ? "active" : "suspended", reason }), () => setReason(""))}>
            {suspended ? "Restore account" : "Suspend account"}
          </Button>
        </section>
      )}
      {canRole && (
        <section aria-labelledby="role-h" className="space-y-3">
          <h3 id="role-h" className="font-semibold">Role</h3>
          <label htmlFor="role-sel" className="sr-only">New role</label>
          <select id="role-sel" className={inputCls} value={newRole} onChange={(e) => setNewRole(e.target.value)} disabled={pending}>
            {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">SUPER_ADMIN cannot be assigned here. It is set only from the command line.</p>
          <Button disabled={pending || newRole === role} onClick={() => run(() => setUserRole({ uid, role: newRole }))}>Change role</Button>
        </section>
      )}
      {canAdjust && (
        <section aria-labelledby="cr-h" className="space-y-3">
          <h3 id="cr-h" className="font-semibold">Adjust credits</h3>
          <label htmlFor="cr-amt" className="block text-sm font-medium">Amount (negative removes). Limit: ±{adjustLimit}</label>
          <input id="cr-amt" inputMode="numeric" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} disabled={pending} />
          <label htmlFor="cr-reason" className="block text-sm font-medium">Reason (recorded in the ledger and audit log)</label>
          <input id="cr-reason" className={inputCls} value={creditReason} onChange={(e) => setCreditReason(e.target.value)} maxLength={200} disabled={pending} />
          <Button disabled={pending || !amount.trim() || creditReason.trim().length < 5}
            onClick={() => run(() => adjustUserCredits({ uid, amount: Number(amount), reason: creditReason, idempotencyKey: keyRef.current }), () => { setAmount(""); setCreditReason(""); keyRef.current = crypto.randomUUID().replace(/-/g, ""); })}>
            Apply adjustment
          </Button>
        </section>
      )}
    </div>
  );
}
