# Elderly Wellbeing Check-in System

A cross-platform mobile application designed to support older adults living independently through scheduled wellbeing reminders and simple check-ins, while providing caregivers with access to wellbeing information.

Developed as part of **COMP826 Mobile Systems Development** at Auckland University of Technology (AUT).

## 1. Project Overview

The Elderly Wellbeing Check-in System provides a simple, non-intrusive approach to supporting older adults living independently.

Rather than relying on wearable devices, continuous monitoring or medical data, the application allows elderly users to confirm their wellbeing through a one-touch check-in.

Caregivers can monitor completed and missed check-ins, view historical records and configure reminder schedules.

The application contains two role-based interfaces within a single React Native application, supported by Firebase for authentication, data storage and synchronisation.

## 2. Key Features

### Elderly User

- **One-touch wellbeing check-in:** Confirm wellbeing using the "I'M OK" button.
- **Current wellbeing status:** View whether a check-in has been completed today.
- **Scheduled reminders:** Receive local notifications at configured reminder times.
- **Next check-in:** View the next scheduled reminder.
- **Check-in history:** Review completed and missed check-in records.

### Caregiver

- **Linked elderly profile:** Access wellbeing information for the linked elderly user.
- **Wellbeing monitoring:** View the current check-in status and most recent completed check-in.
- **Reminder management:** Add, delete and save scheduled reminder times.
- **Check-in history:** Review completed and missed check-in records.
- **Real-time synchronisation:** Receive updated wellbeing information through Firestore listeners.
- **Missed check-in alerts:** Trigger local notifications when new missed check-in records are detected while the caregiver application is running and subscribed.

### Shared Features

- Email and password authentication.
- Role-based navigation and access.
- Firestore cloud data storage.
- Mobile-friendly and accessible user interfaces.

## 3. Technology Stack

| Technology                   | Purpose                                       |
| ---------------------------- | --------------------------------------------- |
| React Native                 | Cross-platform mobile application development |
| Expo                         | Development environment and mobile tooling    |
| TypeScript                   | Type-safe application development             |
| Expo Router                  | File-based navigation                         |
| Firebase Authentication      | User authentication                           |
| Cloud Firestore              | Cloud data storage and synchronisation        |
| Expo Notifications           | Local reminder and notification functionality |
| Jest                         | Automated testing                             |
| React Native Testing Library | Component and interaction testing             |
| Git and GitHub               | Version control and source management         |

## 4. Project Architecture

The application follows a Model-View-Presenter (MVP)-inspired architecture, separating the user interface, application logic and data services.

### Views

Located within `src/app/`, these components provide the application's user interfaces.

- `index.tsx` — Login screen
- `elderly/dashboard.tsx` — Elderly dashboard and wellbeing check-in
- `elderly/history.tsx` — Elderly check-in history
- `caregiver/dashboard.tsx` — Caregiver monitoring dashboard
- `caregiver/history.tsx` — Caregiver check-in history
- `caregiver/schedule.tsx` — Reminder schedule management

### Presenters and Managers

Presenters and managers coordinate application logic and user interactions.

- `AuthPresenter` — Authentication operations
- `CheckInManager` — Wellbeing check-in operations
- `ReminderManager` — Reminder scheduling logic
- `MissedCheckInManager` — Detection and processing of missed reminders

### Services

Services support communication with Firebase and device functionality.

- `DatabaseService` — Firestore operations and real-time subscriptions
- `NotificationService` — Notification permissions and scheduling

The architecture separates responsibilities to improve maintainability, reuse and automated testing.

## 5. Prerequisites

Before running the application, install or prepare:

- Node.js and npm
- Git
- A code editor such as Visual Studio Code
- A Firebase project
- An Android or iOS device, or a compatible emulator/simulator
- Expo Go for supported development features, or an Expo development build for features requiring additional native capabilities

An internet connection is required for Firebase authentication and cloud synchronisation.

## 6. Installation

### Step 1: Clone the Repository

Open a terminal and clone the repository:

```bash
git clone <REPOSITORY_URL>
```

Navigate into the project directory:

```bash
cd elderly-wellbeing-app
```

### Step 2: Install Dependencies

Install the required project dependencies:

```bash
npm install
```

### Step 3: Configure Firebase

The application requires a Firebase project configured with Authentication and Cloud Firestore.

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create or select a Firebase project.
3. Enable **Authentication** and the **Email/Password** sign-in provider.
4. Create a **Cloud Firestore** database.
5. Configure the application using the Firebase project settings.
6. Ensure the application's Firebase configuration file at `src/config/firebase.ts` contains the required configuration.

**Important:** Do not commit private credentials, service-account keys, test-user passwords or local environment files containing secrets to the repository. Apply appropriate Firestore security rules before using the database.

### Step 4: Start the Application

Start the Expo development server:

```bash
npx expo start
```

Expo will display development options and a QR code.

To open the application:

- **iOS:** Scan the QR code using a compatible iPhone and open the project through Expo Go when supported.
- **Android:** Open the project using Expo Go on a compatible Android device.
- **Emulator/Simulator:** Select the relevant platform from the Expo development server, provided the required development tools are installed.

Some notification functionality is not fully supported in Expo Go and requires a development build.

## 7. Test Accounts and User Linking

The application supports two account roles:

| Role        | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| `elderly`   | Can complete wellbeing check-ins and review reminders/history   |
| `caregiver` | Can monitor a linked elderly user and manage reminder schedules |

Each account must have a corresponding profile document in the Firestore `users` collection.

A caregiver account must contain an `elderlyUserId` referencing the Firebase Authentication UID of the linked elderly account.

### Example Elderly Profile

```json
{
  "name": "Example Elderly User",
  "email": "elderly@example.com",
  "role": "elderly"
}
```

### Example Caregiver Profile

```json
{
  "name": "Example Caregiver",
  "email": "caregiver@example.com",
  "role": "caregiver",
  "elderlyUserId": "ELDERLY_USER_UID"
}
```

The Firestore document ID for each profile should match the corresponding authenticated user's UID.

These examples describe the linking mechanism and are not actual login credentials. Test accounts must be created separately using Firebase Authentication.

## 8. Running Automated Tests

The application uses Jest and React Native Testing Library to verify application logic, component behaviour and user interactions.

Run all tests:

```bash
npm test
```

Run a specific test suite:

```bash
npm test -- ElderlyDashboard
```

```bash
npm test -- CaregiverSchedule
```

Check TypeScript compilation:

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Automated tests cover functionality including:

- Authentication and role-based login
- Wellbeing check-in submission
- Check-in status and history
- Reminder management and validation
- Firestore service operations
- Real-time caregiver updates
- Missed check-in processing
- Notification scheduling
- Navigation and logout

## 9. Demonstrating the Prototype

The following workflow can be used to demonstrate the application.

### Elderly Workflow

1. Sign in using an elderly account.
2. View the current wellbeing status and next scheduled reminder.
3. Select **I'M OK** to submit a wellbeing confirmation.
4. Confirm that the dashboard updates to show a completed check-in.
5. Open **History** to review previous records.

### Caregiver Workflow

1. Sign in using a caregiver account linked to the elderly account.
2. View the elderly user's profile and current wellbeing status.
3. Open **View Check-in History** to review completed and missed records.
4. Open **Manage Reminder Schedule**.
5. Add or remove a reminder time.
6. Select **Save Schedule**.
7. Confirm the updated reminder schedule is stored in Firestore.

### Synchronisation Demonstration

1. Open the caregiver application and allow its check-in subscription to initialise.
2. Sign in to the linked elderly account on another device.
3. Complete a wellbeing check-in.
4. Confirm that the caregiver dashboard reflects the new check-in.
5. Inspect Firestore to verify that the record was stored.

### Notification Demonstration

1. Configure a reminder for a short time in the future.
2. Open the elderly dashboard to load and schedule the notifications.
3. Verify that the device has granted notification permission.
4. Confirm that the reminder notification appears at the configured time.
