// Web Worker for Monte Carlo simulation
// Receives: { trades: number[], iterations: number }
// Returns: { data, probProfit, avgEnd, iterations }

self.onmessage = (e) => {
  const { trades, iterations } = e.data;
  const numTrades = trades.length;

  if (numTrades < 5) {
    self.postMessage(null);
    return;
  }

  const mcData = new Array(numTrades + 1);
  for (let j = 0; j <= numTrades; j++) {
    mcData[j] = { trade: j, average: 0 };
  }

  const endEquities = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    let eq = 0;
    const runKey = `run${i}`;
    for (let j = 1; j <= numTrades; j++) {
      eq += trades[Math.floor(Math.random() * numTrades)];
      mcData[j][runKey] = eq;
      mcData[j].average += eq;
    }
    endEquities[i] = eq;
  }

  for (let j = 1; j <= numTrades; j++) {
    mcData[j].average = mcData[j].average / iterations;
  }

  let positiveCount = 0;
  for (let i = 0; i < iterations; i++) {
    if (endEquities[i] > 0) positiveCount++;
  }

  self.postMessage({
    data: mcData,
    iterations,
    probProfit: (positiveCount / iterations) * 100,
    avgEnd: mcData[numTrades].average,
  });
};
