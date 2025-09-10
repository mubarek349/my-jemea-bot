"use client";

import { startTransition, useActionState, useEffect } from "react";

export default function useAction<
  T extends true | undefined,
  Args extends unknown[],
  Data
>(
  func: (...args: Args) => Promise<Data>,
  [isPrevFetch, onFinish]: [T, ((data: Data) => void) | undefined],
  ...args: T extends true ? Args : undefined[]
): [
  Data | undefined,
  T extends true ? () => void : (...payload: Args) => void,
  boolean
] {
  const [data, action, loading] = useActionState(
    async (prev: Data | undefined, payload: Args) => {
      return await func(...payload);
    },
    undefined
  );

  useEffect(() => {
    if (isPrevFetch) {
      startTransition(() => {
        action(args as Args);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...args]);

  useEffect(() => {
    if (data) {
      onFinish?.(data);
    }
  }, [data]);

  return [
    data,
    (...newArgs: Args) => {
      startTransition(() => {
        action((isPrevFetch && newArgs.length === 0 ? args : newArgs) as Args);
      });
    },
    loading,
  ];
}
