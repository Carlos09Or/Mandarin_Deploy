# Province route (retired)

Tapping a province on the map used to open its route: a winding path of felt medallions (one per stop) over
a painted backdrop, with the next stop marked "开始 kāishǐ". It was replaced by the door page
(`app/src/journey/LessonDoor.tsx`): tapping a province now opens the door of the next lesson, and the
traveller walks through it into the lesson. `Route.tsx` is kept here.

What the route used that is still in the app, untouched:

- `STOP_ICONS`, `STORY_ICON`, `backdrop` and `header` in `app/src/data/journey.ts`, and the medallion pictures in
  `app/public/journey/stops/` (the two landmark ones, `arch-bridge` and the canal, are still used by the passport).
- `route-bg-day/night.webp`, `route-pattern.webp`, and the `.j-route*`, `.j-stop*`, `.j-start`, `.j-backdrop`,
  `.j-friend-spot` rules in `journey.css`.
- `TitleCard` in `parts.tsx` (the map uses it too) and `stopsOf`/`nextStop` in `stops.ts`.

The route's "story" stop (Story · The railroad) was only a "coming soon" toast; the door page skips it.

## Putting it back

1. `git mv design/archive/route/Route.tsx app/src/journey/Route.tsx`
2. In `app/src/App.tsx`: add `Route: () => import('./journey/Route').then((m) => ({ default: m.Route }))` to
   `screens` and `const Route = lazy(screens.Route)`; render `<Route province={province} justDone={...}
   onBack={() => setProvince(null)} onBoard={(s) => startRide({ node: s.node, place: s.place, province })} />`
   inside the `Shell` when `tab === 'map' && province`, in place of `LessonDoor`.
3. Add the route's pictures back to `NOW` in `app/src/journey/preload.ts` (medallions, backdrops, pattern).
