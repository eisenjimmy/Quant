import type { ValuationSnapshot } from '../../shared/types';
import { TtlCache } from './cache';
import { lookupName } from './dataFiles';
import { basePriceFor } from './sample';
import { quoteSummary, rawNumber } from './yahoo';

const TTL_MS = 6 * 60 * 60_000;
const cache = new TtlCache<ValuationSnapshot>(300);

function round(value: number | null, digits = 2): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function pct(fairValue: number | null, price: number | null): number | null {
  if (fairValue === null || price === null || price === 0) return null;
  return round(((fairValue - price) / price) * 100, 1);
}

function estimate(
  label: string,
  fairValue: number | null,
  price: number | null,
  formula: string,
): ValuationSnapshot['estimates'][number] {
  return {
    label,
    fairValue: round(fairValue),
    upsidePercent: pct(fairValue, price),
    formula,
  };
}

function sampleValuation(symbol: string): ValuationSnapshot {
  const sym = symbol.toUpperCase();
  const price = basePriceFor(sym);
  const revenue = price * 1_000_000_000;
  const margin = 0.18;
  const shares = 1_000_000_000;
  const netIncome = revenue * margin;
  const fairEarnings = (netIncome * 24) / shares;
  const fairSales = (revenue * 5) / shares;
  return {
    symbol: sym,
    companyName: lookupName(sym) ?? sym,
    price,
    marketCap: price * shares,
    enterpriseValue: price * shares * 1.05,
    totalRevenue: revenue,
    grossProfit: revenue * 0.52,
    ebitda: revenue * 0.25,
    netIncomeToCommon: netIncome,
    profitMargin: margin,
    revenueGrowth: 0.08,
    trailingPe: 24,
    forwardPe: 21,
    priceToSales: 5,
    priceToBook: 7,
    enterpriseToRevenue: 5.2,
    enterpriseToEbitda: 18,
    forwardEps: price / 21,
    targetMeanPrice: price * 1.08,
    sharesOutstanding: shares,
    estimates: [
      estimate('Forward earnings value', fairEarnings, price, 'net income x 24 P/E / shares outstanding'),
      estimate('Sales multiple value', fairSales, price, 'revenue x 5 P/S / shares outstanding'),
      estimate('Analyst target value', price * 1.08, price, 'Yahoo analyst mean target price'),
    ],
    source: 'sample',
  };
}

export async function getValuation(symbol: string): Promise<ValuationSnapshot> {
  const sym = symbol.toUpperCase();
  const cached = cache.get(sym);
  if (cached) return cached;
  try {
    const summary = await quoteSummary(sym, [
      'price',
      'summaryDetail',
      'defaultKeyStatistics',
      'financialData',
    ]);
    const price =
      rawNumber(summary.price?.regularMarketPrice) ??
      rawNumber(summary.financialData?.targetMeanPrice) ??
      null;
    const marketCap = rawNumber(summary.price?.marketCap);
    const shares = rawNumber(summary.defaultKeyStatistics?.sharesOutstanding);
    const revenue = rawNumber(summary.financialData?.totalRevenue);
    const netIncome = rawNumber(summary.financialData?.netIncomeToCommon);
    const priceToSales = rawNumber(summary.summaryDetail?.priceToSalesTrailing12Months);
    const trailingPe = rawNumber(summary.summaryDetail?.trailingPE);
    const targetMean = rawNumber(summary.financialData?.targetMeanPrice);

    const fairForwardEarnings =
      netIncome !== null && shares !== null && trailingPe !== null && shares > 0
        ? (netIncome * trailingPe) / shares
        : null;
    const fairSales =
      revenue !== null && shares !== null && priceToSales !== null && shares > 0
        ? (revenue * priceToSales) / shares
        : null;

    const snapshot: ValuationSnapshot = {
      symbol: sym,
      companyName: summary.price?.longName || summary.price?.shortName || lookupName(sym) || sym,
      price: round(price),
      marketCap: round(marketCap, 0),
      enterpriseValue: round(rawNumber(summary.defaultKeyStatistics?.enterpriseValue), 0),
      totalRevenue: round(revenue, 0),
      grossProfit: round(rawNumber(summary.financialData?.grossProfits), 0),
      ebitda: round(rawNumber(summary.financialData?.ebitda), 0),
      netIncomeToCommon: round(netIncome, 0),
      profitMargin: round(rawNumber(summary.financialData?.profitMargins), 4),
      revenueGrowth: round(rawNumber(summary.financialData?.revenueGrowth), 4),
      trailingPe: round(trailingPe),
      forwardPe: round(rawNumber(summary.summaryDetail?.forwardPE)),
      priceToSales: round(priceToSales),
      priceToBook: round(rawNumber(summary.summaryDetail?.priceToBook)),
      enterpriseToRevenue: round(rawNumber(summary.defaultKeyStatistics?.enterpriseToRevenue)),
      enterpriseToEbitda: round(rawNumber(summary.defaultKeyStatistics?.enterpriseToEbitda)),
      forwardEps: round(rawNumber(summary.defaultKeyStatistics?.forwardEps)),
      targetMeanPrice: round(targetMean),
      sharesOutstanding: round(shares, 0),
      estimates: [
        estimate('Forward earnings value', fairForwardEarnings, price, 'net income x trailing P/E / shares outstanding'),
        estimate('Sales multiple value', fairSales, price, 'revenue x trailing P/S / shares outstanding'),
        estimate('Analyst target value', targetMean, price, 'Yahoo analyst mean target price'),
      ],
      source: 'live',
    };
    cache.set(sym, snapshot, TTL_MS);
    return snapshot;
  } catch {
    const sample = sampleValuation(sym);
    cache.set(sym, sample, 10 * 60_000);
    return sample;
  }
}
