# Train ride (retired)

When a lesson was started, a short animation played first: the train raced past with the traveller
driving and the other friends at the windows, over a painted landscape that rushed the other way
(2.7 s, tap to skip). It was taken out so a lesson opens straight away. Everything it needed is kept here.

| File | What it is |
|---|---|
| `TrainRide.tsx` | The screen. Waits for its pictures, then plays the ride and calls `onDone`. |
| `ride-scenes.ts` | The six painted scenes (five by day, one at night) and `pickRideScene`, which rotates them. |
| `ride.css` | The `.j-ride`, `.j-ride-stage`, `.j-rain`, `.j-speed` and `.j-ride-cap` styles. |
| `images/ride-bg-*.webp` | The six landscape paintings (about 2.4 MB together). |

The train itself (`Train` in `app/src/journey/parts.tsx`, `puff`/`loop`/`crewFor` in `art.ts`, and
`train*.webp`) is still in the app: the trip between provinces (`AllAboard`) uses it. `Strip` in
`parts.tsx` and `.j-strip` in `journey.css` were only for this ride and are still there.

## Putting it back

1. `git mv design/archive/train-ride/TrainRide.tsx app/src/journey/TrainRide.tsx`
2. Move `images/ride-bg-*.webp` back into `app/public/journey/`.
3. Paste `ride-scenes.ts` into `app/src/data/journey.ts` (above "Characters as small portraits") and
   `ride.css` into `app/src/journey/journey.css` (after `.j-overlay`).
4. In `app/src/journey/preload.ts`, add the six `ride-bg-*.webp` files to `LATER`.
5. In `app/src/App.tsx`:
   - add `TrainRide: () => import('./journey/TrainRide').then((m) => ({ default: m.TrainRide }))` to
     `screens` and `const TrainRide = lazy(screens.TrainRide)`;
   - add `const [ride, setRide] = useState<Ride | null>(null)`, put `ride` back into `busy`, and make
     `onBoard` call `setRide({ node: s.node, place: s.place, province })` again;
   - render it next to the lesson:

   ```tsx
   {ride && (
     <Later>
       <TrainRide
         place={ride.place}
         traveler={progress.traveler}
         night={isNight(progress)}
         // Stay on screen until the lesson's code is here, so the route can't be tapped in between.
         onDone={() =>
           void screens.LessonPlayer().catch(() => undefined).then(() => {
             startRide(ride)
             setRide(null)
           })
         }
       />
     </Later>
   )}
   ```

   (`isNight` comes from `./lib/progress`.)

The git history before the commit that retired it has the same files in place.
