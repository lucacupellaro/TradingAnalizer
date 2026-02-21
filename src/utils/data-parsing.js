import { parseNum } from './formatting';

// Find header row index in raw data
export const findHeaderRowIndex = (rows) => {
  let hIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const fc = String(rows[i]?.[0] || '').trim().toLowerCase();
    if (fc === 'deals' || fc === 'operazioni') {
      hIdx = i + 1;
      break;
    }
  }

  if (hIdx === -1) {
    for (let i = 0; i < rows.length; i++) {
      const cB = String(rows[i]?.[1] || '').toLowerCase().trim();
      const cD = String(rows[i]?.[3] || '').toLowerCase().trim();
      const cL = String(rows[i]?.[11] || '').toLowerCase().trim();
      if ((cB === 'deal' || cB === 'operazione') && (cD === 'type' || cD === 'tipo') && cL.includes('profit')) {
        hIdx = i;
        break;
      }
    }
  }

  return hIdx;
};

// Parse trades from raw data
export const parseTrades = (rawRows, colConfig) => {
  if (!rawRows.length || colConfig.headerRowIdx === -1) return [];

  const trades = [];
  const { headerRowIdx, profitIdx, idIdx, typeIdx, dirIdx, posIdx, symIdx, commIdx, feeIdx, swapIdx, balanceIdx } = colConfig;
  const q = {};

  for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !row[0]) break;

    const fc = String(row[0] || '').toLowerCase().trim();
    if (fc === '' || fc === 'orders' || fc.includes('total')) break;

    const typ = String(row[typeIdx] || '').toLowerCase().trim();
    if (typ !== 'buy' && typ !== 'sell') continue;

    const dir = String(row[dirIdx] || '').toLowerCase().trim(),
      sym = row[symIdx] ? String(row[symIdx]).trim() : 'Sconosciuto',
      cmt = row[idIdx] ? String(row[idIdx]).trim() : '';

    const tMs = new Date(fc.replace(/\./g, '/')).getTime();
    let pft = parseNum(row[profitIdx]);
    if (isNaN(pft)) pft = 0;

    let comm = parseNum(row[commIdx]), fee = parseNum(row[feeIdx]), swap = parseNum(row[swapIdx]);

    if (!q[sym]) q[sym] = [];

    let ast = 'Senza Commento', iC = 0, iF = 0, iS = 0, iT = null, iM = false;

    if (dir === 'in') {
      ast = cmt || 'Senza Commento';
      q[sym].push({ st: ast, c: isNaN(comm) ? 0 : comm, f: isNaN(fee) ? 0 : fee, s: isNaN(swap) ? 0 : swap, t: tMs });
    } else {
      if (q[sym].length > 0) {
        const inT = q[sym].shift();
        ast = inT.st;
        iC = inT.c;
        iF = inT.f;
        iS = inT.s;
        iT = inT.t;
      } else {
        ast = cmt || 'Senza Commento';
      }
      iM = true;
    }

    trades.push({
      TimeMs: isNaN(tMs) ? null : tMs,
      OpenTimeMs: iT || tMs,
      CloseTimeMs: tMs,
      Type: typ,
      Direction: dir,
      Id: ast,
      Symbol: sym,
      Profit: pft,
      Commission: isNaN(comm) ? 0 : comm,
      Fee: isNaN(fee) ? 0 : fee,
      Swap: isNaN(swap) ? 0 : swap,
      inComm: iC,
      inFee: iF,
      inSwap: iS,
      IsMergedOut: iM
    });
  }

  return trades;
};

// Filter trades based on applied filters
export const filterTrades = (trades, filters) => {
  return trades.filter(t => {
    if (filters.dir !== 'all' && t.Direction !== filters.dir) return false;
    if (filters.tradeType !== 'all' && t.Type !== filters.tradeType) return false;
    if (filters.symbols.length > 0 && !filters.symbols.includes(t.Symbol)) return false;
    if (filters.strategies.length > 0 && !filters.strategies.includes(t.Id)) return false;
    if (filters.dateStart && t.TimeMs < new Date(filters.dateStart).getTime()) return false;
    if (filters.dateEnd && t.TimeMs > new Date(filters.dateEnd).getTime() + 86400000) return false;
    return true;
  });
};
