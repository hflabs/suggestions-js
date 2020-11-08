export const withFakeTimers = async (
  ...fns: (() => Promise<void> | void)[]
): Promise<void> => {
  jest.useFakeTimers();

  for (let i = 0; i < fns.length; i++) {
    if (i > 0) jest.runAllTimers();
    await fns[i]();
  }

  jest.useRealTimers();
};
