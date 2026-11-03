# Asynchronous state validity

## Read requests

A response belongs to a particular request and view context. A shared organization value read at completion may already refer to another selection; capture the requested values at start. A same-key refresh still has two distinct generations.

For a single latest-query panel, use an existing equivalent of:

```js
let generation = 0;
let mounted = true;
let currentKey = "";

async function load(key) {
  const mine = ++generation;
  currentKey = key;
  setLoading(true);
  const valid = () => mounted && mine === generation && key === currentKey;
  try {
    const result = await existingClient.read(key);
    if (valid()) setData(result);
  } catch (error) {
    if (valid()) setError(error);
  } finally {
    if (valid()) setLoading(false);
  }
}
function invalidate(nextKey) {
  currentKey = nextKey;
  generation += 1;
  // Apply the specified reset policy here, outside any old completion callback.
}
function dispose() {
  mounted = false;
  generation += 1;
}
```

This is explanatory framework-neutral code. Adapt it to the real component lifecycle and render state; do not paste module-level mutable state into a shared React component. In React, refs or effect-local cleanup may fit existing code. Values that belong to one mounted instance must not leak across instances. A cleanup flag for each effect can ignore that effect's results, while events outside the effect may need additional identity handling.

Cancellation can save work, but clients may not support it, callbacks can race with cancellation and server work may continue. Eligibility at commit time is the correctness guard. Do not misreport every thrown error as cancellation; use the client's actual error contract.

## Context and state transitions

| Event | Required decision |
|---|---|
| Organization/period changes | Invalidate the old context immediately if its result is no longer valid, even when no new request starts |
| New request for same context | Decide latest wins vs merge; distinguish requests by identity |
| Old request fails | Do not overwrite the latest success/error/loading state |
| View closes/unmounts | Invalidate instance-bound callbacks; reopening creates a new lifecycle |
| Independent panels | Use panel/key-specific identity; one panel should not cancel another by accident |
| Pagination/streaming | Define append/order semantics; latest-wins is not automatically correct |
| Cache reuses a key | Include every contractually relevant dimension, not just a display label |

## Saves and edits

A read response can be ignored locally. A server mutation may have already taken effect even if the client stopped waiting. Preserve the submitted payload/version, any later local revision, and the returned server version separately. A completion should mark only the submitted revision saved; clearing a form containing newer edits loses data.

For duplicate submissions, inspect whether the server provides an idempotency key or business uniqueness constraint. A disabled button is not a cross-device duplicate-write guarantee. For concurrent edits, inspect version/ETag/conflict handling before choosing last-writer-wins. Do not add retries without understanding side effects.

## Deterministic verification

Use explicit deferred-promise resolve/reject handles in the installed test framework. Start A and B, settle each manually, then wait for the framework's normal update flush. Assert the visible data and loading/error state for the current context. Test assertions must fail if the eligibility guard is removed. Delays alone do not prove a particular order.

The bundled lab uses an event reducer and manual completion, so it has no HTTP cancellation or React integration. Its event log is useful for explaining a suspected race; it is not a replay of real user traffic.
