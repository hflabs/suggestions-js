/**
 * Promises' resolved/rejected handlers are run in microtasks, after the current stack is complete.
 * setTimeout schedules function to the next macrotask, so all waiting code will be executed
 */
export const waitPromisesResolve = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve));
};
