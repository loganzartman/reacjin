import React, {useCallback, useMemo, useRef, useState} from 'react';

type Undoable<T> = {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

function isStateUpdater<T>(
  action: React.SetStateAction<T>,
): action is (prevState: T) => T {
  return typeof action === 'function';
}

export function useUndoable<T>(
  stateTuple: [T, React.Dispatch<React.SetStateAction<T>>],
  {maxHistory = 50}: {maxHistory?: number} = {},
): Undoable<T> {
  const [state, _setState] = stateTuple;
  const [undoStack, setUndoStack] = useState<T[]>([]);
  const [redoStack, setRedoStack] = useState<T[]>([]);
  const stateRef = useRef<T>(state);
  const undoStackRef = useRef<T[]>([]);
  const redoStackRef = useRef<T[]>([]);
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  stateRef.current = state;
  undoStackRef.current = undoStack;
  redoStackRef.current = redoStack;

  const setState: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (action) => {
      const state = stateRef.current;
      setUndoStack((undoStack) => [...undoStack, state].slice(-maxHistory));
      setRedoStack([]);
      _setState((state) => (isStateUpdater(action) ? action(state) : action));
    },
    [_setState, maxHistory],
  );

  const undo = useCallback(() => {
    const state = stateRef.current;
    const undoStack = undoStackRef.current;
    if (undoStack.length < 1) return;
    _setState(undoStack[undoStack.length - 1]);
    setUndoStack((undoStack) => undoStack.slice(0, -1));
    setRedoStack((redoStack) => [...redoStack, state]);
  }, [_setState]);

  const redo = useCallback(() => {
    const state = stateRef.current;
    const redoStack = redoStackRef.current;
    if (redoStack.length < 1) return;
    _setState(redoStack[redoStack.length - 1]);
    setRedoStack((redoStack) => redoStack.slice(0, -1));
    setUndoStack((undoStack) => [...undoStack, state]);
  }, [_setState]);

  return useMemo(
    () => ({
      state,
      setState,
      undo,
      redo,
      canUndo,
      canRedo,
    }),
    [state, setState, undo, redo, canUndo, canRedo],
  );
}
