import { useState, useMemo } from 'react';
import { INITIAL_FILTERS } from '../config/constants';
import { filterTrades, parseTrades } from '../utils/data-parsing';

export const useAnalysis = (rawRows, colConfig) => {
  const [showTable, setShowTable] = useState(true);
  const [groupBy, setGroupBy] = useState('Strategy');
  const [tableFilters, setTableFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formulaIdx, setFormulaIdx] = useState(0);
  const [mcIterations, setMcIterations] = useState(50);

  // Parse all trades
  const parsedTrades = useMemo(() => {
    return parseTrades(rawRows, colConfig);
  }, [rawRows, colConfig]);

  // Get unique symbols and strategies
  const uniqueSymbols = useMemo(
    () => Array.from(new Set(parsedTrades.map(t => t.Symbol))).sort(),
    [parsedTrades]
  );

  const uniqueStrategies = useMemo(
    () => Array.from(new Set(parsedTrades.map(t => t.Id))).filter(id => id !== 'Senza Commento').sort(),
    [parsedTrades]
  );

  // Apply table filters
  const filteredTableTrades = useMemo(
    () => filterTrades(parsedTrades, tableFilters),
    [parsedTrades, tableFilters]
  );

  // Apply analysis filters
  const analyzedTrades = useMemo(
    () => filterTrades(parsedTrades, appliedFilters),
    [parsedTrades, appliedFilters]
  );

  const triggerAnalysis = () => {
    setIsAnalyzing(true);
    setFormulaIdx(0);
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % 6; // 6 formulas
      setFormulaIdx(i);
    }, 350);
    setTimeout(() => {
      clearInterval(interval);
      setAppliedFilters(tableFilters);
      setIsAnalyzing(false);
    }, 1500);
  };

  return {
    parsedTrades,
    uniqueSymbols,
    uniqueStrategies,
    filteredTableTrades,
    analyzedTrades,
    showTable,
    setShowTable,
    groupBy,
    setGroupBy,
    tableFilters,
    setTableFilters,
    appliedFilters,
    setAppliedFilters,
    isAnalyzing,
    formulaIdx,
    mcIterations,
    setMcIterations,
    triggerAnalysis
  };
};
