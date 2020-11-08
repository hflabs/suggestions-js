/**
 * Let resolve promises in a sequence.
 * When the next promise is created, previous pending promise rejects.
 */
import { deepEqual } from "./deepEqual";

interface PendingCall<A extends unknown[], R> {
  args: A;
  promise: Promise<R>;
}

export const queuedPromiseFactory = <
  A extends unknown[] = unknown[],
  R = unknown
>(
  factory: (...args: A) => Promise<R>,
  createRejectionData: (...args: A) => unknown = () => new Error()
): ((...args: A) => Promise<R>) => {
  let pendingCall: PendingCall<A, R> | null = null;
  let pendingReject: ((reason?: unknown) => void) | null = null;

  return (...args: A): Promise<R> => {
    if (pendingCall) {
      if (deepEqual(pendingCall.args, args)) {
        return pendingCall.promise;
      }
    }

    if (pendingReject) pendingReject();

    pendingCall = {
      args,
      promise: new Promise<R>((resolve, reject) => {
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
