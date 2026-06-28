import { useCallback } from 'react';

export const useCurrency = () => {
  const formatRupiah = useCallback((amount) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }, []);

  return { formatRupiah };
};
