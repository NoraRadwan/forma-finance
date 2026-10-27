import { CreditCard, ShoppingBag } from 'lucide-react';
import { dueLabel, dueTone, daysUntil, money } from '../../lib/credit.js';
import { shortDate } from '../../lib/format.js';

export function DueChip({ date }) {
  if (!date) return null;
  return <span className={`cc-chip ${dueTone(daysUntil(date))}`}>{dueLabel(date)}</span>;
}

export function LimitBar({ used, limit, usedLabel = 'used', currency }) {
  const fmt = money(currency);
  const pct = limit > 0 ? Math.min(100, used / limit * 100) : 0;
  return <div>
    <div className="cc-limit-line"><b>{limit > 0 ? `${fmt(Math.max(0, limit - used))} available` : 'No limit set'}</b><span className="cc-sub">{fmt(used)} {usedLabel}{limit > 0 ? ` of ${fmt(limit)}` : ''}</span></div>
    <div className="cc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Credit limit used"><i className={pct >= 100 ? 'full' : pct > 80 ? 'hi' : ''} style={{ width: `${pct}%` }} /></div>
  </div>;
}

export function CardVisual({ account, line1, line2, icon: Icon = CreditCard, kindLabel = 'Credit card' }) {
  return <div className="cc-visual" style={{ '--cc-a': account.color || '#6c7cf5' }}>
    <span className="cc-v-icon"><Icon size={18} /></span>
    <div><small>{kindLabel}</small><strong>{account.name}</strong>{line1 && <small style={{ marginTop: 6 }}>{line1}</small>}{line2 && <small>{line2}</small>}</div>
  </div>;
}

// Big tile used on the Debts & installments list and the Overview strip.
export function CardTile({ card, summary, currency, onOpen, onPay }) {
  const fmt = money(currency);
  const next = summary.next;
  return <section className="panel cc-tile">
    <CardVisual account={card} line1={card.statement_day ? `Statement on the ${card.statement_day}th` : 'Statement day not set'} line2={card.grace_days != null ? `Pay within ${card.grace_days} days` : ''} />
    <div className="cc-tile-body">
      <div>
        <div className="cc-row-between"><span className="cc-label">Next payment</span>{next ? <DueChip date={next.due} /> : <span className="cc-chip ok">All paid</span>}</div>
        {next ? <><div className="cc-amount">{fmt(next.remaining)}</div><div className="cc-sub">Due {shortDate(next.due)}</div></> : <div className="cc-amount ok">All clear</div>}
      </div>
      <LimitBar used={summary.owed} limit={summary.limit} currency={currency} />
      <div className="cc-actions">{next && <button className="btn btn-primary" onClick={() => onPay(card)}>Pay {fmt(next.remaining)}</button>}<button className="btn btn-secondary" onClick={() => onOpen(card)}>View details</button></div>
    </div>
  </section>;
}

export function ProviderTile({ provider, summary, currency, onOpen, onPay }) {
  const fmt = money(currency);
  const next = summary.next;
  return <section className="panel cc-tile">
    <CardVisual account={provider} icon={ShoppingBag} kindLabel="Installment app" line1={`${summary.active.length} active plan${summary.active.length === 1 ? '' : 's'}`} line2={summary.monthly > 0 ? `${fmt(summary.monthly)} every month` : ''} />
    <div className="cc-tile-body">
      <div>
        <div className="cc-row-between"><span className="cc-label">Next payment</span>{next ? <DueChip date={next.due} /> : <span className="cc-chip ok">{summary.active.length ? 'Not scheduled' : 'No active plans'}</span>}</div>
        {next ? <><div className="cc-amount">{fmt(next.amount)}</div><div className="cc-sub">Due {shortDate(next.due)} · {next.plans.length} plan{next.plans.length === 1 ? '' : 's'}</div></> : <div className="cc-amount ok">All clear</div>}
      </div>
      <LimitBar used={summary.used} limit={summary.limit} usedLabel="committed" currency={currency} />
      <div className="cc-actions">{next && <button className="btn btn-primary" onClick={() => onPay(provider, next)}>Pay {fmt(next.amount)}</button>}<button className="btn btn-secondary" onClick={() => onOpen(provider)}>View details</button></div>
    </div>
  </section>;
}
