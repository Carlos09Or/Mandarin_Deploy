// The words of the app in English. `es.ts` has the same shape (TypeScript checks it), so nothing can be left untranslated.
// Texts that need a name or a number are functions. Only what has been moved here is translated; the rest still lives in the
// components, in English.

export const en = {
  language: { continue: 'Continue' },
  google: 'Continue with Google',
  welcome: {
    saveTitle: 'Keep your progress safe?',
    saveText: 'Sign in to carry on from any phone or computer, or just play as a guest.',
    guest: 'Play as a guest',
    guestNote: 'As a guest your progress is saved on this device only. You can sign in later from Profile and nothing is lost.',
    nameTitle: 'What should we call you?',
    nameText: 'A first name or a nickname, whatever you like.',
    nameTextGuest: 'A first name or a nickname, whatever you like. Your progress stays on this device.',
    namePlaceholder: 'Your name',
    nameLabel: 'Your name or nickname',
    go: 'Let’s go',
    back: 'Back',
  },
  intro: {
    skip: 'Skip',
    next: 'Next',
    letsGo: 'Let’s go!',
    slides: [
      {
        alt: 'The four friends smiling together at sunrise, with the little train on the bridge behind them',
        title: (name: string) => (name ? `Hi, ${name}!` : 'Hi there!'),
        text: 'We are Wāwa, Yīngyīng, Lǎnlǎn and Zuǐzuǐ, your travel buddies. Let’s learn Mandarin together, one stop at a time.',
        tab: '',
      },
      {
        alt: 'The friends on the station platform, looking at a phone that shows the map',
        title: () => 'Travel through Panama',
        text: 'The Map is your home. Tap a province to open its doors.',
        tab: 'Map',
      },
      {
        alt: 'Wāwa pointing at a phone that shows the doors of a province, next to a red door',
        title: () => 'Open a door, learn 5 words',
        text: 'Each door is a lesson: five new words, then quick exercises. Swipe between the doors and tap to start.',
        tab: 'Lessons',
      },
      {
        alt: 'The friends at a table, listening and writing, while Wāwa points at a phone that shows a character to trace',
        title: () => 'Write with your finger',
        text: 'In the Write tab, trace each character stroke by stroke, then write it from memory.',
        tab: 'Write',
      },
      {
        alt: 'Wāwa cheering beside blue gems and a phone that shows a review card',
        title: () => 'Review and earn gems',
        text: 'In the Review tab each word comes back right before you forget it. Tell us how well you remembered.',
        tab: 'Review',
      },
      {
        alt: 'The four friends around a phone that shows the profile with the travel buddies',
        title: () => 'Make it yours',
        text: 'In Profile, pick your travel buddy and watch your streak, points and gems grow.',
        tab: 'Profile',
      },
    ],
  },
  profile: {
    hi: (name: string) => (name ? `Hi, ${name}!` : 'Hi!'),
    yourName: 'Your name',
    tourTitle: 'How it works',
    tourText: 'A quick tour of the map, the doors, the exercises and the review cards.',
    tourButton: 'Watch the tour',
    languageTitle: 'Language',
    languageText: 'The words and explanations of the app.',
  },
  nudge: {
    label: 'Save your progress',
    lesson: 'First lesson done!',
    streak: (days: number) => `${days} days in a row!`,
    text: 'Right now your progress is only on this device. Keep it in an account so a lost phone or cleared browser can’t take it away.',
    iphone: ' On iPhone, you can also tap Share, then “Add to Home Screen”.',
    notNow: 'Not now',
  },
  app: { welcomeBack: (name: string) => `Welcome back, ${name}!` },
}

export type Texts = typeof en
