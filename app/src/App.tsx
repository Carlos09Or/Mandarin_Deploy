import { useCallback, useState } from 'react'
import { Shell, type Tab } from './components/Shell'
import type { PathNode } from './data/course'
import { FRIEND_IDS, type FriendId } from './data/friends'
import type { Province } from './data/journey'
import { AllAboard } from './journey/AllAboard'
import { MapHome, type MapEvent } from './journey/MapHome'
import { Passport } from './journey/Passport'
import { Route } from './journey/Route'
import { TrainRide } from './journey/TrainRide'
import { nextProvince } from './journey/stops'
import { toast } from './journey/toast'
import { LessonComplete } from './lesson/LessonComplete'
import { LessonPlayer, type LessonSummary } from './lesson/LessonPlayer'
import { buildNode, buildReview, buildWriting, type Exercise } from './lib/lesson'
import { completeNode, getProgress, isNight, useProgress, type Reward } from './lib/progress'
import { Profile } from './screens/Profile'
import { Review } from './screens/Review'
import { Write } from './screens/Write'

type Session = {
  exercises: Exercise[]
  nodeId: string | null
  newWords: number[]
  key: number
  buddy: FriendId
  station?: string
  province?: Province
}
type Result = { summary: LessonSummary; reward: Reward; newWords: number[]; buddy: FriendId; nodeId: string | null; stamp: Province | null }
type Ride = { node: PathNode; place: string; province: Province }

/** The characters take turns: each finished lesson hands over to the next one. */
const nextBuddy = (): FriendId => {
  const done = Object.values(getProgress().nodes).reduce((a, n) => a + n.completions, 0)
  return FRIEND_IDS[done % FRIEND_IDS.length]
}

export default function App() {
  const progress = useProgress()
  const [tab, setTab] = useState<Tab>('map')
  // The journey: a province's route, the train ride into a lesson, the stamp, the trip onward.
  const [province, setProvince] = useState<Province | null>(null)
  const [justDone, setJustDone] = useState<string | null>(null)
  const [ride, setRide] = useState<Ride | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [stamp, setStamp] = useState<Province | null>(null)
  const [aboard, setAboard] = useState<{ from: Province; to: Province } | null>(null)
  const [mapEvent, setMapEvent] = useState<MapEvent | null>(null)

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
      // Passing a province's checkpoint for the first time earns its stamp.
      const earned = firstPass && session.nodeId?.endsWith('-cp') ? (session.province ?? null) : null
      setResult({ summary, reward, newWords: session.newWords, buddy: session.buddy, nodeId: session.nodeId, stamp: earned })
      setSession(null)
    },
    [session],
  )

  const afterResult = () => {
    if (!result) return
    setResult(null)
    if (result.stamp) setStamp(result.stamp)
    else setJustDone(result.nodeId)
  }

  const afterStamp = () => {
    const from = stamp!
    setStamp(null)
    const to = nextProvince(from)
    if (to) setAboard({ from, to })
    else {
      setProvince(null)
      toast('More provinces are coming soon')
    }
  }

  const arrive = () => {
    const trip = aboard!
    setAboard(null)
    setProvince(null)
    setTab('map')
    setMapEvent({ hopFrom: trip.from.id, hopTo: trip.to.id })
  }

  const onTab = (t: Tab) => {
    setTab(t)
    if (t === 'map') setProvince(null)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <Shell tab={tab} onTab={onTab} bleed={tab === 'map'}>
        {tab === 'map' &&
          (province ? (
            <Route
              key={province.id}
              province={province}
              justDone={justDone}
              onBack={() => setProvince(null)}
              onBoard={(s) => setRide({ node: s.node, place: s.place, province })}
            />
          ) : (
            <MapHome
              onOpen={(p) => {
                setJustDone(null)
                setProvince(p)
              }}
              event={mapEvent}
              onEventDone={() => setMapEvent(null)}
            />
          ))}
        {tab === 'review' && (
          <Review onReview={(pool) => start(buildReview(pool, getProgress()))} onWrite={(c, n) => start(buildWriting(c, n))} />
        )}
        {tab === 'write' && <Write onWrite={(c, n) => start(buildWriting(c, n))} />}
        {tab === 'passport' && <Passport />}
        {tab === 'profile' && <Profile />}
      </Shell>

      {ride && (
        <TrainRide
          place={ride.place}
          traveler={progress.traveler}
          night={isNight(progress)}
          onDone={() => {
            startRide(ride)
            setRide(null)
          }}
        />
      )}
      {session && (
        <LessonPlayer
          key={session.key}
          exercises={session.exercises}
          buddy={session.buddy}
          station={session.station}
          onExit={() => setSession(null)}
          onFinish={finish}
        />
      )}
      {result && (
        <LessonComplete
          summary={result.summary}
          reward={result.reward}
          buddy={result.buddy}
          newWords={result.newWords}
          onContinue={afterResult}
        />
      )}
      {stamp && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <Passport
            fresh={stamp}
            onNext={afterStamp}
            nextLabel={nextProvince(stamp) ? `Next stop: ${nextProvince(stamp)!.name} 🚂` : 'Back to the map'}
          />
        </div>
      )}
      {aboard && <AllAboard from={aboard.from} to={aboard.to} traveler={progress.traveler} onDone={arrive} />}
    </>
  )
}
