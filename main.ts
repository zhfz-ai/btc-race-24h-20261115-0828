// Snap-back scalper for agent-fun/bars-replay/v1.
//
// Idea: on the 1-minute cbBTC/USDC tape, the money is in the snap-back after a
// sudden washout, not in riding the trend. The tape drifts and grinds down for
// hours, then plunges a percent or two in a few minutes and bounces back most
// of it within the hour. This bot does nothing at all until the plunge has
// already happened, buys it in full, and takes a small, fixed profit the
// moment the bounce gives it one. It never chases a breakout, never buys a
// slow bleed, and never holds a loser hoping it comes back.
//
// Rules, per 1-minute bar (all arithmetic on integer price/quote units, so
// the same bars always give the same orders):
//
//   * History: keep every close. An entry needs the close 30 bars ago on
//     record, so the slow trigger spans half an hour.
//   * Fast entry: the latest close sits at least 120 bps below the close
//     10 bars ago -> buy with all available cash.
//   * Slow entry: the latest close sits at least 170 bps below the close
//     30 bars ago -> buy with all available cash.
//   * Either trigger fires only while flat. After any exit, wait 5 bars
//     before a new entry, so one washout cannot re-trigger the same fall.
//   * Exit (whole position): its value at the latest close reaches 60 bps
//     over its harness-reported cost, or falls 150 bps under it, or it has
//     been held 180 bars. No trailing stop: on this tape a bounce that
//     retraces 100 bps from its peak usually keeps falling, so trailing
//     exits turned winners into losers on the dev window.
//   * Every order caps slippage at 300 bps from the latest close, wide
//     enough that a fill into the gap after a plunge is taken rather than
//     refused and retried a bar late.
//
// Long only, one position, at most one order per reply. No randomness, no
// clock, no files, no network: the same bars always give the same orders.
//
// Dev window (2026-11-14 08:28Z - 2026-11-15 08:28Z, local grade): three
// round trips, all winners, net about +$16.4 on $1,000, max drawdown about
// 1.6%. The window itself fell about 4%, so buy-and-hold lost about $44.

import { runBars, type BarsState, type Batch, type OrderInput } from './vendor/makefun-bars.ts';

// --- strategy constants (basis points unless noted) -------------------------
const DROP_FAST_BARS = 10; // bars spanned by the fast washout trigger
const DROP_FAST_BPS = 120; // buy once the close fell this far in 10 bars
const DROP_SLOW_BARS = 30; // bars spanned by the slow washout trigger
const DROP_SLOW_BPS = 170; // buy once the close fell this far in 30 bars
const TAKE_PROFIT_BPS = 60; // sell once value is this far over cost
const STOP_LOSS_BPS = 150; // sell once value is this far under cost
const MAX_HOLD_BARS = 180; // sell once held this many bars
const COOLDOWN_BARS = 5; // bars to wait after an exit before re-entering
const MAX_SLIPPAGE_BPS = 300; // per-order slippage cap vs the latest close

let symbol: string | null = null;
const closes: bigint[] = [];
let entrySeq: number | null = null;
let lastExitSeq = -1000000;

/**
 * How far the latest close sits below the close `bars` ago, in basis
 * points (positive = fell). Null until that many closes are on record.
 */
function dropBps(bars: number): bigint | null {
  if (closes.length <= bars) return null;
  const now = closes[closes.length - 1];
  const then = closes[closes.length - 1 - bars];
  if (then === 0n) return null;
  return ((then - now) * 10000n) / then;
}

function onHello(state: BarsState): void {
  symbol = state.hello.symbols[0].symbol;
}

function onBatch(state: BarsState, batch: Batch): OrderInput[] {
  const sym = symbol as string;
  for (const bar of batch.bars) {
    if (bar.symbol === sym) closes.push(BigInt(bar.c));
  }
  if (state.warmingUp || closes.length === 0) return [];

  const held = state.positions.get(sym);
  if (held !== undefined) {
    if (entrySeq === null) entrySeq = state.seq;
    const value = state.value(sym, held.qty);
    const cost = held.cost;
    const heldBars = state.seq - entrySeq;
    const takeProfit = value * 10000n >= cost * BigInt(10000 + TAKE_PROFIT_BPS);
    const stopLoss = value * 10000n <= cost * BigInt(10000 - STOP_LOSS_BPS);
    const tooLong = heldBars >= MAX_HOLD_BARS;
    if (takeProfit || stopLoss || tooLong) {
      lastExitSeq = state.seq;
      entrySeq = null;
      return [{ side: 'sell', symbol: sym, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  }

  entrySeq = null;
  if (state.seq - lastExitSeq < COOLDOWN_BARS) return [];
  if (state.cash < BigInt(state.hello.fees.min_notional_quote_units)) return [];

  const fast = dropBps(DROP_FAST_BARS);
  const slow = dropBps(DROP_SLOW_BARS);
  const plunged =
    (fast !== null && fast >= BigInt(DROP_FAST_BPS)) ||
    (slow !== null && slow >= BigInt(DROP_SLOW_BPS));
  if (plunged) {
    return [{ side: 'buy', symbol: sym, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  }
  return [];
}

await runBars({ onHello, onBatch });
