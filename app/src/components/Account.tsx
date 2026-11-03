import { useState } from 'react'
import { needsHomeScreen } from '../lib/storage'
import { GoogleG } from './GoogleButton'
import { deleteAccount, signInForDevelopment, signInWithGoogle, signOut, syncNow, useAccount } from '../lib/account'

const when = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60_000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`
}

/** Sign in, sync status and sign out. Shows nothing where there are no accounts (static hosting). */
export function Account() {
  const a = useAccount()
  const [ask, setAsk] = useState<'out' | 'unsynced' | 'delete' | null>(null)
  const [email, setEmail] = useState('')

  if (!a.available) {
    return <p className="text-sm text-muted">Your progress is saved on this device.</p>
  }
  if (a.loading) return null

  if (!a.user) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          You are playing as a guest: your progress is saved on this device only, and a lost phone or cleared browser would take
          it away. Sign in to keep it in your account and carry on from any phone or computer. What you have done so far comes with you.
        </p>
        {needsHomeScreen() && (
          <p className="text-sm text-muted">On iPhone, tap Share, then “Add to Home Screen”: Safari keeps the progress of an installed app.</p>
        )}
        {a.google && (
          <button type="button" onClick={signInWithGoogle} className="btn btn-ghost normal-case">
            <GoogleG /> Sign in with Google
          </button>
        )}
        {a.dev && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void signInForDevelopment(email)
            }}
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dev email"
              className="min-w-0 flex-1 rounded-2xl border-2 border-line-dark bg-card px-4 py-2 text-sm"
            />
            <button type="submit" className="btn btn-ghost">
              Dev sign-in
            </button>
          </form>
        )}
        {!a.google && !a.dev && <p className="text-sm text-muted">Accounts are not switched on yet.</p>}
        {a.problem && <p className="text-sm font-bold text-wrong">{a.problem}</p>}
      </div>
    )
  }

  const status =
    a.sync === 'syncing'
      ? 'Syncing…'
      : a.sync === 'error'
        ? 'Not synced yet — it will try again when you are online.'
        : a.syncedAt
          ? `Synced ${when(a.syncedAt)}`
          : 'Synced'

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-extrabold">{a.user.name}</p>
        <p className="text-sm text-muted">{a.user.email}</p>
        <button type="button" onClick={() => void syncNow()} className="mt-1 text-left text-sm font-bold text-sky-dark">
          {status}
        </button>
      </div>

      {a.user.isAdmin && (
        <a href="/admin" className="btn btn-ghost">
          Learners (admin)
        </a>
      )}

      {ask === 'unsynced' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-wrong-soft p-4">
          <p className="text-sm font-bold text-wrong-dark">Some of your latest progress hasn’t reached your account. Signing out now would lose it.</p>
          <button type="button" onClick={() => setAsk(null)} className="btn btn-ghost">
            Stay signed in
          </button>
          <button type="button" onClick={() => void signOut(true).then(() => setAsk(null))} className="btn btn-wrong">
            Sign out and lose it
          </button>
        </div>
      )}
      {ask === 'delete' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-wrong-soft p-4">
          <p className="text-sm font-bold text-wrong-dark">
            This deletes your account and the progress stored in it. The progress on this device stays.
          </p>
          <button type="button" onClick={() => setAsk(null)} className="btn btn-ghost">
            Keep my account
          </button>
          <button type="button" onClick={() => void deleteAccount().then(() => setAsk(null))} className="btn btn-wrong">
            Delete my account
          </button>
        </div>
      )}
      {ask === null && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void signOut().then((r) => setAsk(r === 'unsynced' ? 'unsynced' : null))}
            className="btn btn-ghost flex-1"
          >
            Sign out
          </button>
          <button type="button" onClick={() => setAsk('delete')} className="btn btn-ghost flex-1 text-wrong">
            Delete account
          </button>
        </div>
      )}
      {ask === null && <p className="text-xs text-muted">Signing out also clears this device. Your progress stays in your account.</p>}
    </div>
  )
}
