import { useState } from 'react'
import { useAccount } from '../lib/account'
import { finishWelcome, NICKNAME_MAX, useProgress } from '../lib/progress'
import { keepStorage } from '../lib/storage'
import { Buddy } from './Friends'
import { GoogleButton } from './GoogleButton'

/**
 * The first screens, right after the loading screen: sign in or play as a guest, then what to call the learner.
 * Shown until the learner is welcomed (progress.welcomed), which also arrives with an account's progress on a new device.
 */
export function Welcome() {
  const a = useAccount()
  const p = useProgress()
  const [guest, setGuest] = useState(false)
  // Until they type, the name is the one already kept, or the first name of the Google account that has just signed in.
  const [typed, setTyped] = useState<string | null>(null)
  const name = typed ?? (p.nickname || (a.user?.name.split(' ')[0] ?? '').slice(0, NICKNAME_MAX))

  const clean = name.trim()
  // Signed in or playing as a guest: only the name is left. So it is on a device with no accounts at all (static hosting).
  const choosing = !a.user && !guest && (a.loading || a.available)

  const done = () => {
    finishWelcome(clean)
    keepStorage()
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-paper">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <Buddy id="wawa" mood="happy" size={150} />
        <div>
          <p className="font-display text-lg font-bold text-sky-dark">Mandarin Journey</p>
          <h1 className="mt-1 text-3xl font-black">{choosing ? 'Keep your progress safe?' : 'What should we call you?'}</h1>
          <p className="mt-2 text-muted">
            {choosing
              ? 'Sign in to carry on from any phone or computer, or just play as a guest.'
              : a.user
                ? 'A first name or a nickname, whatever you like.'
                : 'A first name or a nickname, whatever you like. Your progress stays on this device.'}
          </p>
        </div>

        {choosing ? (
          <div className="flex w-full flex-col gap-3">
            <GoogleButton disabled={!a.google} />
            <button type="button" onClick={() => setGuest(true)} className="btn btn-ghost">
              Play as a guest
            </button>
            <p className="text-sm text-muted">
              As a guest your progress is saved on this device only. You can sign in later from Profile and nothing is lost.
            </p>
            {a.problem && <p className="text-sm font-bold text-wrong">{a.problem}</p>}
          </div>
        ) : (
          <form
            className="flex w-full flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (clean) done()
            }}
          >
            <input
              value={name}
              onChange={(e) => setTyped(e.target.value)}
              maxLength={NICKNAME_MAX}
              autoFocus
              autoComplete="nickname"
              enterKeyHint="go"
              placeholder="Your name"
              aria-label="Your name or nickname"
              className="w-full rounded-2xl border-2 border-line-dark bg-card px-4 py-3.5 text-center text-xl font-bold"
            />
            <button type="submit" disabled={!clean} className="btn btn-primary w-full">
              Let’s go
            </button>
            {guest && !a.user && (
              <button type="button" onClick={() => setGuest(false)} className="text-sm font-bold text-muted">
                Back
              </button>
            )}
          </form>
        )}
      </main>
    </div>
  )
}
