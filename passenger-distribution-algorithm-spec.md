# Passenger-to-Vehicle Distribution Algorithm — Design Spec

## Context

I'm building a React Native app (following MVC) that helps event/trip organizers split a group of passengers across multiple vehicles. An organizer has:

- A total passenger count (drivers count as passengers — they occupy a seat too)
- A set of available cars, each with its own seat capacity (not assumed uniform — e.g. some cars might be 5-seaters, others 7-seaters)

The app should produce a suggested distribution of passengers across cars, which the organizer can then manually adjust (drag/reassign individual passengers between cars) before finalizing.

I'd like feedback/improvements on the algorithm design below, particularly around: edge cases I may have missed, the rerun-detection heuristic, and the manual-edit-vs-suggestion interaction model.

## Requirements

1. **Two selectable optimization strategies** (organizer picks one, e.g. in an "advanced settings" panel):
   - **Minimize cars**: use the fewest vehicles possible, packing them as full as comfort/capacity allows.
   - **Maximize comfort**: spread passengers across *all* available cars as evenly as possible, even if some seats are left empty in every car, to reduce per-car crowding.
2. **Capacity constraint**: no car can ever be assigned more passengers than its seat count.
3. **Even distribution within the chosen strategy**: whichever cars are in use, passengers should be spread as evenly as possible among them (no car should have 5 while another has 2, if it could've been 4/3).
4. **Manual override**: after the algorithm suggests an assignment, the organizer can manually move individual passengers between cars. Manual moves should never be silently overwritten.
5. **Rerun behavior on data changes**: if the organizer edits a car's seat capacity (e.g. corrects a 5-seater to a 7-seater) *after* the initial suggestion was generated, the app should detect that the original suggestion may now be suboptimal and prompt the organizer to rerun the algorithm — rather than either (a) silently reshuffling everything automatically, or (b) leaving a stale, no-longer-optimal suggestion in place with no feedback.
6. **Feasibility check**: total passengers must not exceed total seats across all cars; should fail gracefully/explicitly if not.

## Current algorithm design

### Shared distribution logic

Given a set of cars to use and a passenger count, distribute as evenly as possible using a largest-remainder approach:

1. Compute `idealShare = totalPassengers / numCarsInUse`.
2. Assign each car `floor(idealShare)` passengers, capped at that car's capacity.
3. Distribute the remainder one passenger at a time, each time giving the next passenger to the car with the most remaining spare capacity (recompute spare capacity after each increment).
4. Stop when all passengers are assigned, or no car has spare capacity left (shouldn't occur if feasibility was checked upfront).

### Strategy-specific car selection

- **Minimize cars**: sort cars by capacity descending. Walk through them accumulating capacity until the running total ≥ total passengers — that's the minimum car count needed. Use only those (largest) cars; leave the rest unused. Then run the shared distribution logic across just that subset.
- **Maximize comfort**: use all available cars, then run the shared distribution logic across the full set.

### Reference implementation (JavaScript)

```js
const DistributionStrategy = {
  MINIMIZE_CARS: 'minimize_cars',
  MAXIMIZE_COMFORT: 'maximize_comfort',
};

function distributePassengers(totalPassengers, cars, strategy = DistributionStrategy.MINIMIZE_CARS) {
  // cars: [{ id, capacity }]
  // totalPassengers includes drivers

  const sortedCars = [...cars].sort((a, b) => b.capacity - a.capacity);
  const totalCapacity = sortedCars.reduce((sum, c) => sum + c.capacity, 0);

  if (totalPassengers > totalCapacity) {
    throw new Error('Not enough seats for all passengers');
  }

  let carsInUse, carsUnused;

  if (strategy === DistributionStrategy.MINIMIZE_CARS) {
    let runningCapacity = 0;
    let carsNeeded = 0;
    for (const car of sortedCars) {
      runningCapacity += car.capacity;
      carsNeeded += 1;
      if (runningCapacity >= totalPassengers) break;
    }
    carsInUse = sortedCars.slice(0, carsNeeded);
    carsUnused = sortedCars.slice(carsNeeded).map(car => ({ ...car, count: 0 }));
  } else {
    // MAXIMIZE_COMFORT: use every available car
    carsInUse = sortedCars;
    carsUnused = [];
  }

  const n = carsInUse.length;
  const idealShare = totalPassengers / n;

  let assignments = carsInUse.map(car => ({
    ...car,
    count: Math.min(Math.floor(idealShare), car.capacity),
  }));

  let assigned = assignments.reduce((sum, a) => sum + a.count, 0);
  let remaining = totalPassengers - assigned;

  while (remaining > 0) {
    const candidates = assignments
      .filter(a => a.count < a.capacity)
      .sort((a, b) => (b.capacity - b.count) - (a.capacity - a.count));
    if (candidates.length === 0) break; // shouldn't happen post feasibility-check
    candidates[0].count += 1;
    remaining -= 1;
  }

  return { assignments: [...assignments, ...carsUnused], strategy };
}
```

**Worked examples:**

- 15 passengers, 4 cars × 5 seats, `MINIMIZE_CARS` → uses 3 cars → `[5, 5, 5]`, 1 car unused.
- 15 passengers, 4 cars × 5 seats, `MAXIMIZE_COMFORT` → uses all 4 → `[4, 4, 4, 3]`.
- 15 passengers, cars [3, 5, 5, 5], `MINIMIZE_CARS` → uses the three 5-seaters → `[5, 5, 5]`, the 3-seater unused.

### Rerun-detection heuristic (on car capacity edits)

When a car's capacity is edited post-suggestion, re-run the algorithm in the background (without applying it) and diff against the current assignment:

```js
function shouldSuggestRerun(currentAssignments, cars, totalPassengers, strategy) {
  const { assignments: freshSuggestion } = distributePassengers(totalPassengers, cars, strategy);

  const currentCarsUsed = currentAssignments.filter(a => a.count > 0).length;
  const freshCarsUsed = freshSuggestion.filter(a => a.count > 0).length;

  if (strategy === DistributionStrategy.MINIMIZE_CARS && freshCarsUsed < currentCarsUsed) {
    return { suggest: true, reason: 'fewer_cars_possible' };
  }

  const spread = arr => Math.max(...arr.map(a => a.count)) - Math.min(...arr.map(a => a.count));
  if (spread(freshSuggestion) < spread(currentAssignments) - 1) {
    return { suggest: true, reason: 'better_balance_possible' };
  }

  return { suggest: false };
}
```

If triggered, surface a non-destructive banner/prompt ("Seat counts changed — a better distribution is available. Recalculate?") rather than auto-applying.

## Design decisions made so far (and reasoning)

- **Drivers count as passengers** — they occupy a seat, so they're included in `totalPassengers` and in capacity math.
- **Strategy is a per-trip/event setting**, exposed under "advanced settings," defaulting to `MINIMIZE_CARS` (fewer vehicles = less coordination overhead for the organizer, assumed to be the more common priority).
- **Rerun is a deliberate, explicit action**, never automatic — manual passenger placements are the source of truth once they exist, and a full rerun is treated as an intentional reset that the organizer opts into (via a "recalculate" prompt), not something that silently fires on every data edit.
- **MVC split**: Model holds `cars[]` (with `capacity` and an actual array of assigned passenger IDs, not just a count, to support drag-and-drop reassignment) and the current `strategy`. Controller exposes `recalculateDistribution()` (invokes the algorithm, only called on explicit user action) and `movePassenger(passengerId, fromCarId, toCarId)` (validates destination capacity, never re-triggers the algorithm). View renders state and calls Controller methods.
- **Capacity-edit nudge is meant to be debounced** — should fire on confirm/blur of a capacity field, not on every keystroke, to avoid banner spam while the organizer is still typing a number.

## Open questions / things I'm unsure about

1. **Is the "fewest cars" heuristic actually desirable in all cases?** E.g., 15 passengers across cars [3, 5, 5, 5] under `MINIMIZE_CARS` leaves the 3-seat car completely idle and packs the other three to 100% capacity with zero slack. Is there a better middle-ground strategy (e.g., fewest cars *with* a slack buffer) worth offering as a third option?
2. **Should manually-placed passengers be "locked" from being touched by a rerun**, while unplaced/suggested-only passengers are freely reshuffled? Right now a rerun is all-or-nothing (replaces everything). A partial/scoped rerun would be more surgical but adds real complexity — is it worth it, or is "rerun replaces everything, so do it deliberately" the right tradeoff for an MVP?
3. **Is comparing on `carsUsed` and `spread` (max-min count) sufficient signal for the rerun nudge**, or are there cases this heuristic misses or false-positives on? Open to a more principled diffing approach if one exists.
4. Any edge cases in the algorithm itself worth hardening against (e.g., zero cars, a car with 0 capacity, ties in the largest-remainder step, very large passenger counts)?

Looking for critique, alternative approaches, and anything that would make this more robust before I implement it in the app's Model layer.
