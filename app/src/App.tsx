import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { SaveNudge } from './components/SaveNudge'
import { Shell, type Tab } from './components/Shell'
import { useWelcomeState } from './components/useWelcomeState'
import { Welcome } from './components/Welcome'
import type { PathNode } from './data/course'
import { FRIEND_IDS, type FriendId } from './data/friends'
import type { Province } from './data/journey'
import { MapHome, type MapEvent } from './journey/MapHome'
import { Splash } from './journey/Splash'
import { nextProvince } from './journey/stops'
import { warmAhead, whenLoaded } from './journey/preload'
import { startAccount } from './lib/account'
import { canWarm } from './lib/network'
import { keepStorage } from './lib/storage'
import { holdUpdates, registerUpdates } from './lib/updates'
import { toast } from './journey/toast'
import { QUICK_FRIEND_FILES } from './lesson/friends'
import type { LessonSummary } from './lesson/LessonPlayer'
import { buildNode, buildWriting, type Exercise } from './lib/lesson'
import { completeNode, getProgress, useProgress, type Reward } from './lib/progress'

// Everything but the map is loaded as its own file, so the app opens on the map without downloading the
// lessons, the writing trainer or the review cards first. They are fetched in the background once it is open.
const screens = {
  LessonDoor: () => import('./journey/LessonDoor').then((m) => ({ default: m.LessonDoor })),
  LessonComplete: () => import('./lesson/LessonComplete').then((m) => ({ default: m.LessonComplete })),
  LessonPlayer: () => import('./lesson/LessonPlayer').then((m) => ({ default: m.LessonPlayer })),
  Profile: () => import('./screens/Profile').then((m) => ({ default: m.Profile })),
  Review: () => import('./screens/Review').then((m) => ({ default: m.Review })),
  Write: () => import('./screens/Write').then((m) => ({ default: m.Write })),
}
const LessonDoor = lazy(screens.LessonDoor)
// The door page is what you open first from the map, so its code is fetched right away, not when idle.
void screens.LessonDoor()
const LessonComplete = lazy(screens.LessonComplete)
const LessonPlayer = lazy(screens.LessonPlayer)
const Profile = lazy(screens.Profile)
const Review = lazy(screens.Review)
const Write = lazy(screens.Write)

/** Each lazy screen waits on its own, so a slow download never blanks the rest of the app. */
const Later = ({ children, cover }: { children: React.ReactNode; cover?: boolean }) => (
  <Suspense fallback={cover ? <div className="fixed inset-0 z-50 bg-paper" /> : null}>{children}</Suspense>
)

type Session = {
  exercises: Exercise[]
  nodeId: string | null
  newWords: number[]
  key: number
  buddy: FriendId
  station?: string
  province?: Province
}
type Result = { summary: LessonSummary; reward: Reward; newWords: number[]; buddy: FriendId; nodeId: string | null; finished: Province | null }
type Ride = { node: PathNode; place: string; province: Province }

/** The characters take turns: each finished lesson hands over to the next one. */
const nextBuddy = (): FriendId => {
  const done = Object.values(getProgress().nodes).reduce((a, n) => a + n.completions, 0)
  return FRIEND_IDS[done % FRIEND_IDS.length]
}

export default function App() {
  const progress = useProgress()
  const [tab, setTab] = useState<Tab>('map')
  // The journey: a province's door page, the lesson, its result, back to the doors.
  const [province, setProvince] = useState<Province | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [mapEvent, setMapEvent] = useState<MapEvent | null>(null)
  // The loading screen preloads every picture once; the app is mounted behind it meanwhile.
  const [loaded, setLoaded] = useState(false)
  const mapVisible = tab === 'map' && !province
  // The door page fades in over the map, so the map stays drawn (still) until the page has covered it.
  const [covered, setCovered] = useState(false)
  useEffect(() => setCovered(false), [province])
  const mapShown = mapVisible || (tab === 'map' && !covered)

  // Once the map is open, what the learner will most likely open next (their next lesson: its code, door, voice clips and
  // friends) is fetched while they look at it, on any connection. The service worker only starts after that: its install
  // downloads the app a second time for offline use, which on a slow line would fight the next lesson for the connection.
  useEffect(() => {
    if (!loaded) return
    void screens.LessonPlayer()
    void warmAhead().then(registerUpdates)
    // Who is signed in, and the sync, start once the map is open so they never compete with the loading screen.
    void startAccount()
    // Welcome back: said once per visit, only to someone who has been welcomed before (the welcome screens say hello themselves).
    const { welcomed, nickname } = getProgress()
    if (welcomed && nickname) {
      toast(`Welcome back, ${nickname.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}!`)
      keepStorage()
    }
  }, [loaded])
  const welcome = useWelcomeState()
  // The map stays still, and its "unlocked" toast waits, until the learner is through the welcome screens.
  const welcoming = welcome !== 'closed'

  // Then the other screens are fetched while the browser is idle, so they open at once.

  useEffect(() => {
    if (!loaded) return
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1000))
    // On a slow line they are fetched when opened (about 90 KB), not ahead of the map's own pictures.
    idle(() => canWarm() && Object.values(screens).forEach((load) => void load()))
  }, [loaded])

  // A new version of the app reloads the page, so it waits until the learner isn't mid-lesson.
  const busy = !!(session || result)
  useEffect(() => (busy ? holdUpdates() : undefined), [busy])

  const start = (exercises: Exercise[], nodeId: string | null = null, newWords: number[] = [], journey?: Ride) =>
    setSession({ exercises, nodeId, newWords, key: Date.now(), buddy: nextBuddy(), station: journey?.place, province: journey?.province })

  const startRide = (r: Ride) => {
    const p = getProgress()
    // Words only count as new the first time a lesson is completed.
    const fresh = r.node.kind === 'lesson' && !p.nodes[r.node.id] ? r.node.words : []
    start(buildNode(r.node, p), r.node.id, fresh, r)
  }

  const finish = useCallback(
    (summary: LessonSummary) => {
      if (!session) return
      const firstPass = session.nodeId ? !getProgress().nodes[session.nodeId] : false
      const reward = completeNode(session.nodeId, summary)
      // Passing a province's checkpoint for the first time finishes the province.
      const finished = firstPass && session.nodeId?.endsWith('-cp') ? (session.province ?? null) : null
      setResult({ summary, reward, newWords: session.newWords, buddy: session.buddy, nodeId: session.nodeId, finished })
      setSession(null)
    },
    [session],
  )

  const afterResult = () => {
    if (!result) return
    setResult(null)
    // A lesson leaves the province's page on its next door. Finishing the province goes back to the map instead: the next
    // province opens there and the traveller hops over to it.
    const done = result.finished
    if (!done) return
    const to = nextProvince(done)
    setProvince(null)
    if (to) {
      setTab('map')
      setMapEvent({ hopFrom: done.id, hopTo: to.id })
    } else toast('More provinces are coming soon')
  }

  const onTab = (t: Tab) => {
    setTab(t)
    if (t === 'map') setProvince(null)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <Shell tab={tab} onTab={onTab} bleed={tab === 'map'}>
        {/* The map stays mounted behind every other screen, so it never loads twice. */}
        <div className={mapShown ? 'contents' : 'hidden'}>
          <MapHome
            active={loaded && mapVisible && !welcoming}
            onOpen={setProvince}
            event={mapEvent}
            onEventDone={() => setMapEvent(null)}
          />
        </div>
        {tab === 'review' && (
          <Later>
            <Review onWrite={(c, n) => start(buildWriting(c, n))} />
          </Later>
        )}
        {tab === 'write' && (
          <Later>
            <Write onWrite={(c, n) => start(buildWriting(c, n))} />
          </Later>
        )}
        {tab === 'profile' && (
          <Later>
            <Profile />
          </Later>
        )}
      </Shell>

      {session && (
        <Later cover>
          <LessonPlayer
            key={session.key}
            exercises={session.exercises}
            buddy={session.buddy}
            station={session.station}
            onExit={() => setSession(null)}
            onFinish={finish}
          />
        </Later>
      )}
      {tab === 'map' && province && !busy && (
        <Later>
          <LessonDoor
            key={province.id}
            province={province}
            traveler={progress.traveler}
            onBack={() => setProvince(null)}
            onCovered={() => setCovered(true)}
            // The walk to the door takes a couple of seconds: the lesson's code and the friends' pictures arrive meanwhile.
            onWalk={() => {
              void screens.LessonPlayer()
              void whenLoaded(QUICK_FRIEND_FILES)
            }}
            // Stay on screen until the lesson's code is here, so the page can't be tapped in between.
            onDone={(stop) =>
              void screens.LessonPlayer().catch(() => undefined).then(() => startRide({ ...stop, province }))
            }
          />
        </Later>
      )}
      {result && (
        <Later>
          <LessonComplete
            summary={result.summary}
            reward={result.reward}
            buddy={result.buddy}
            newWords={result.newWords}
            nodeId={result.nodeId}
            onContinue={afterResult}
          />
        </Later>
      )}
      <SaveNudge quiet={tab === 'map' && !province && !busy && !welcoming} />
      {welcome === 'open' && <Welcome />}
      {welcome === 'waiting' && <div className="fixed inset-0 z-[60] bg-paper" />}
      {!loaded && <Splash onDone={() => setLoaded(true)} />}
    </>
  )
}
