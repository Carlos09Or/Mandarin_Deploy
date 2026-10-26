import { useCallback, useState } from 'react'
import { Shell, type Tab } from './components/Shell'
import type { PathNode } from './data/course'
import { FRIEND_IDS, type FriendId } from './data/friends'
import { LessonComplete } from './lesson/LessonComplete'
import { LessonPlayer, type LessonSummary } from './lesson/LessonPlayer'
import { buildNode, buildReview, buildWriting, type Exercise } from './lib/lesson'
import { completeNode, getProgress, type Reward } from './lib/progress'
import { Learn } from './screens/Learn'
import { Profile } from './screens/Profile'
import { Review } from './screens/Review'
import { Write } from './screens/Write'

type Session = { exercises: Exercise[]; nodeId: string | null; newWords: number[]; key: number; buddy: FriendId }
type Result = { summary: LessonSummary; reward: Reward; newWords: number[]; buddy: FriendId }

/** The characters take turns: each finished lesson hands over to the next one. */
const nextBuddy = (): FriendId => {
  const done = Object.values(getProgress().nodes).reduce((a, n) => a + n.completions, 0)
  return FRIEND_IDS[done % FRIEND_IDS.length]
}

export default function App() {
  const [tab, setTab] = useState<Tab>('learn')
  const [session, setSession] = useState<Session | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const start = (exercises: Exercise[], nodeId: string | null = null, newWords: number[] = []) =>
    setSession({ exercises, nodeId, newWords, key: Date.now(), buddy: nextBuddy() })

  const startNode = (node: PathNode) => {
    const p = getProgress()
    // Words only count as new the first time a lesson is completed.
    const fresh = node.kind === 'lesson' && !p.nodes[node.id] ? node.words : []
    start(buildNode(node, p), node.id, fresh)
  }

  const finish = useCallback(
    (summary: LessonSummary) => {
      if (!session) return
      const reward = completeNode(session.nodeId, summary)
      setResult({ summary, reward, newWords: session.newWords, buddy: session.buddy })
      setSession(null)
    },
    [session],
  )

  return (
    <>
      <Shell
        tab={tab}
        onTab={(t) => {
          setTab(t)
          window.scrollTo(0, 0)
        }}
      >
        {tab === 'learn' && <Learn onStart={startNode} />}
        {tab === 'review' && (
          <Review onReview={(pool) => start(buildReview(pool, getProgress()))} onWrite={(c, n) => start(buildWriting(c, n))} />
        )}
        {tab === 'write' && <Write onWrite={(c, n) => start(buildWriting(c, n))} />}
        {tab === 'profile' && <Profile />}
      </Shell>

      {session && (
        <LessonPlayer
          key={session.key}
          exercises={session.exercises}
          buddy={session.buddy}
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
          onContinue={() => setResult(null)}
        />
      )}
    </>
  )
}
