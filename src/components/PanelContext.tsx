import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {v4 as uuid} from 'uuid';

type PanelContextValue = {
  stackingOrder: string[];
  setStackingOrder: React.Dispatch<React.SetStateAction<string[]>>;
};

export const PanelContext = React.createContext<PanelContextValue | null>(null);

export function PanelProvider({children}: {children: React.ReactNode}) {
  const [stackingOrder, setStackingOrder] = useState<string[]>([]);
  const value = useMemo(
    () => ({stackingOrder, setStackingOrder}),
    [stackingOrder, setStackingOrder],
  );

  return (
    <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
  );
}

export function usePanel() {
  const value = useContext(PanelContext);
  if (!value) throw new Error('usePanel must be used within a PanelProvider');

  const {stackingOrder, setStackingOrder} = value;
  const [id] = useState(uuid());

  useEffect(() => {
    setStackingOrder((order) => {
      return [...order, id];
    });
    return () => {
      setStackingOrder((order) => {
        return order.filter((x) => x !== id);
      });
    };
  }, [id, setStackingOrder]);

  const zIndex = useMemo(() => stackingOrder.indexOf(id), [id, stackingOrder]);

  const active = useMemo(
    () => stackingOrder[stackingOrder.length - 1] === id,
    [id, stackingOrder],
  );

  const activate = useCallback(() => {
    setStackingOrder((order) => {
      return [...order.filter((x) => x !== id), id];
    });
  }, [id, setStackingOrder]);

  const result = useMemo(
    () => ({zIndex, active, activate}),
    [zIndex, active, activate],
  );

  return result;
}
