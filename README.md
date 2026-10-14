# Study Space

Study Space is a responsive study planner for students. It combines a generated daily timetable, exam revision plans, assignment deadlines, goals, focus sessions, and progress tracking in one workspace.

## Features

- Email/password and Google authentication with Firebase, plus local demo mode when Firebase settings are absent.
- One Firestore document per student containing profile, exams, assignments, goals, and study sessions.
- Daily, weekly, and monthly schedule views; move exam and assignment dates by dragging their chips.
- Weighted study blocks, break reminders, revision plans, syllabus readiness, and assignment status filters.
- Timestamp-based focus timer, study stats, weekly charts, browser reminders, and persistent light/dark mode.
- Responsive navigation, keyboard focus styles, accessible labels, and reduced-motion support.

## Run locally

Requires Node.js 18 or newer and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To check the production build:

```sh
npm run build
npm run preview
```

## Demo mode

With no `.env` file, Study Space uses demo mode. Enter any email and password on the login page; data is saved in this browser's localStorage. Demo accounts are keyed by email, so use the same email to return to the same workspace. Google sign-in uses a demo student identity in this mode.

## Firebase setup

1. Create a Firebase project and register a Web app in the Firebase console.
2. Under **Authentication > Sign-in method**, enable **Email/Password** and **Google**.
3. Create a Cloud Firestore database.
4. Copy `.env.example` to `.env` and paste the Firebase Web app config values into the matching `VITE_FIREBASE_*` variables.
5. Set your Firebase project ID in `.firebaserc`, then run the app again. Deploying Firestore rules requires the Firebase CLI.

The application stores each student's profile and planning data in the single `users/{uid}` document. `firestore.rules` limits access to the signed-in owner of that document.

## Deploy to Netlify

1. Push the project to a Git provider supported by Netlify.
2. In Netlify, choose **Add new site > Import an existing project** and select the repository.
3. Keep the base directory blank. Set the build command to `npm run build` and the publish directory to `dist` (these values are also in `netlify.toml`).
4. If using Firebase, add each `VITE_FIREBASE_*` value from `.env.example` in **Site configuration > Environment variables**, then redeploy.

Netlify uses the redirect in `netlify.toml` to serve the React app for routes such as `/schedule` and `/profile`.

### Deploy Firestore rules

The site is hosted on Netlify; Firebase remains the authentication and database backend. To publish the security rules, install and authenticate with the Firebase CLI:

```sh
npm install -g firebase-tools
firebase login
```

Set the Firebase project ID in `.firebaserc`, then run:

```sh
npm install
firebase deploy --only firestore:rules
```

For a custom Netlify domain, also add the domain under Firebase **Authentication > Settings > Authorized domains**.