// Formatting utilities
export const getAvgTimeStr = (timesArray) => {
  if (!timesArray) return "-";
  const validTimes = timesArray.filter(t => t !== null && t !== undefined && !isNaN(t));
  if (!validTimes.length) return "-";
  let totalMins = 0;
  validTimes.forEach(t => {
    const d = new Date(t);
    totalMins += d.getHours() * 60 + d.getMinutes();
  });
  const avgMins = Math.round(totalMins / validTimes.length);
  return `${String(Math.floor(avgMins / 60)).padStart(2, '0')}:${String(avgMins % 60).padStart(2, '0')}`;
};

export const formatXAxisDate = (dateStr) => {
  if (!dateStr || dateStr === 'Unk') return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length >= 3) return `${parts[2]}-${parts[1]}`;
    return String(dateStr);
  } catch (e) {
    return '';
  }
};

export const parseNum = (val) => {
  if (val == null || val === '') return NaN;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(/\s/g, '').replace(',', '.'));
};
