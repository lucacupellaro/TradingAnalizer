import { useState } from 'react';
import { DEFAULT_COL_CONFIG } from '../config/constants';
import { findHeaderRowIndex } from '../utils/data-parsing';

export const useFileUpload = () => {
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [colConfig, setColConfig] = useState(DEFAULT_COL_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = window.XLSX.read(evt.target.result, { type: 'array' });
        processRawData(window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }));
      } catch (err) {
        setError("Errore lettura file.");
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processRawData = (rows) => {
    const hIdx = findHeaderRowIndex(rows);

    if (hIdx === -1) {
      setError("Tabella Deal non trovata.");
      setIsLoading(false);
      return;
    }

    setHeaders(rows[hIdx].map((c, i) => ({ idx: i, label: `${c || '(Vuota)'}` })));
    setColConfig({
      headerRowIdx: hIdx,
      symIdx: 2,
      typeIdx: 3,
      dirIdx: 4,
      posIdx: 7,
      commIdx: 8,
      feeIdx: 9,
      swapIdx: 10,
      profitIdx: 11,
      balanceIdx: 12,
      idIdx: 13
    });
    setRawRows(rows);
    setIsLoading(false);
  };

  return {
    rawRows,
    headers,
    colConfig,
    isLoading,
    error,
    handleFileUpload
  };
};
