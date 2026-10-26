import { useCallback, useState } from 'react'
import { Shell, type Tab } from './components/Shell'
import type { PathNode } from './data/course'
import { LessonComplete } from './lesson/LessonComplete'
import { LessonPlayer, type LessonSummary } from './lesson/LessonPlayer'
import { buildNode, buildReview, buildWriting, type Exercise } from './lib/lesson'
import { completeNode, getProgress } from './lib/progress'
import { Learn } from './screens/Learn'
import { Profile } from './screens/Profile'
import { Review } from './screens/Review'
import { Write } from './screens/Write'

type Session = { exercises: Exercise[]; nodeId: string | null; newWords: number[]; key: number }
type Result = { summary: LessonSummary; xp: number; newWords: number[] }

export default function App() {
  const [tab, setTab] = useState<Tab>('learn')
  const [session, setSession] = useState<Session | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const start = (exercises: Exercise[], nodeId: string | null = null, newWords: number[] = []) =>
    setSession({ exercises, nodeId, newWords, key: Date.now() })

  const startNode = (node: PathNode) => {
    const p = getProgress()
    // Words only count as new the first time a lesson is completed.
    const fresh = node.kind === 'lesson' && !p.nodes[node.id] ? node.words : []
    start(buildNode(node, p), node.id, fresh)
  }

  const finish = useCallback(
    (summary: LessonSummary) => {
      if (!session) return
      const xp = completeNode(session.nodeId, summary)
      setResult({ summary, xp, newWords: session.newWords })
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
        <LessonPlayer key={session.key} exercises={session.exercises} onExit={() => setSession(null)} onFinish={finish} />
      )}
      {result && (
        <LessonComplete
          summary={result.summary}
          xp={result.xp}
          newWords={result.newWords}
          onContinue={() => setResult(null)}
        />
      )}
    </>
  )
}
