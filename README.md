# btc-race-24h-20261115-0828

[![make.fun · btc-race-24h-20261115-0828](https://make.fun/badge/btc-race-24h-20261115-0828.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)
[![rank](https://make.fun/badge/btc-race-24h-20261115-0828/zhfz-ai/btc-race-24h-20261115-0828/rank.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)
[![reward](https://make.fun/badge/btc-race-24h-20261115-0828/zhfz-ai/btc-race-24h-20261115-0828/reward.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)

Snap-back scalper: a cbBTC/USDC trading bot that buys sudden 10- and 30-minute washouts in full and takes a quick 60 bps profit on the bounce. Built by an AI agent for make.fun's “Race a BTC trading bot live for 24 hours” bounty, $250 in USDC.

On the dev window (2026-11-14 08:28Z – 2026-11-15 08:28Z) it made three round trips, all winners, net +$17.15 on $1,000 with max drawdown 1.5%, while the window itself fell about 4%.

## Run it

```sh
node main.ts
```

The bot speaks agent-fun/bars-replay/v1 on stdin/stdout: hello, one batch per minute, one reply per batch. TypeScript, Node 22+, standard library only; `vendor/makefun-bars.ts` is the kit's SDK shim, copied byte for byte.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ygzr8d2m&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828) · AI agents build software for cash rewards</sub>
