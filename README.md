# Jeopardy!

A custom Jeopardy game for a host + up to 3 remote friends, playable in the browser. Build your own boards (text, images, answers), host a game with a room code, and play Single, Double, and Final Jeopardy with live buzz-ins and scoring.

Built with React + TypeScript + Vite, backed by Firebase (Firestore + Anonymous Auth) on the free Spark plan — no server to run, no credit card required.

## How it works

- **Host**: creates/edits boards, starts a game, gets a room code, reads clues aloud, opens the buzzer, and judges answers.
- **Players** (up to 3): open the game link on their own device, enter the room code + their name, and play — the board, current clue, and buzzer all sync live.
- Everyone needs an internet connection; players do **not** need to be in the same room as the host.

## One-time setup

### 1. Create a free Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a new project (the free **Spark** plan, no credit card needed).
2. In the project, go to **Build > Firestore Database** and create a database (start in production mode — the included security rules handle access control).
3. Go to **Build > Authentication > Sign-in method** and enable the **Anonymous** provider.
4. Go to **Project settings > General > Your apps**, add a **Web app**, and copy the `firebaseConfig` values it gives you.

### 2. Configure this project

```bash
npm install
cp .env.example .env
```

Fill in the six `VITE_FIREBASE_*` values in `.env` from the config you copied above.

### 3. Deploy Firestore security rules

Install the Firebase CLI if you don't have it, then log in and deploy the rules (only needs to be repeated if you edit `firestore.rules`):

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your Firebase project
firebase deploy --only firestore:rules
```

## Running locally

```bash
npm run dev
```

Open the printed `localhost` URL. You (the host) can create boards and start a game. To test the player side, open the same URL in another browser/incognito window and join with the room code.

## Playing with friends over the internet

Deploy the built app to Firebase Hosting (free) so friends can reach it from anywhere:

```bash
npm run build
firebase deploy --only hosting
```

Firebase will print a live URL (`https://<your-project>.web.app`) — share that with your friends. You open it and click **Host a game**; they open it and click **Join a game** with the room code you give them.

## Building a board

From the host home screen, go to **My Boards** → **New board**. Fill in category titles and click each clue cell to set its text, an optional image URL, the correct answer, and whether it's a Daily Double. Fill in the Final Jeopardy tab too. Click **Save board**, then **Host game** to start a session with it.

## Known limitations

These are accepted trade-offs of staying on Firebase's free, no-backend-code tier — fine for a casual game night, not built for a public/competitive product:

- **Buzzer fairness** depends on each player's network latency to Firestore's servers (whoever's buzz commits first wins) — correct and never double-awards, but not a hardware-precise race.
- **Final Jeopardy's countdown timer** is enforced client-side only; there's no server clock to stop a modified client from submitting after time's up.
- **Access is by room code**, not password-protected accounts — fine among friends, not meant for a public room.
