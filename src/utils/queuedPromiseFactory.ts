/**
 * Let resolve promises in a sequence.
 * When the next promise is created, previous pending promise rejects.
 */
import { deepEqual } from "./deepEqual";

interface PendingCall<Args extends unknown[], Result> {
  args: Args;
  promise: Promise<Result>;
}

export const queuedPromiseFactory = <
  Args extends unknown[] = unknown[],
  Result = unknown
>(
  factory: (...args: Args) => Promise<Result>,
  createRejectionData: (...args: Args) => unknown = () => new Error()
): ((...args: Args) => Promise<Result>) => {
  let pendingCall: PendingCall<Args, Result> | null = null;
  let pendingReject: ((reason?: unknown) => void) | null = null;

  return (...args: Args): Promise<Result> => {
    if (pendingCall) {
      if (deepEqual(pendingCall.args, args)) {
        return pendingCall.promise;
      }
    }

    if (pendingReject) pendingReject();

    pendingCall = {
      args,
      promise: new Promise<Result>((resolve, reject) => {
        // Expose rejection callback
        pendingReject = () => reject(createRejectionData(...args));

        factory(...args)
          .finally(() => {
            pendingCall = null;
            pendingReject = null;
          })
          .then(resolve, reject);
      }),
    };

    return pendingCall.promise;
  };
};
