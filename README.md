# Elderly Wellbeing Check-in System

A cross-platform mobile application designed to support older adults living independently through scheduled wellbeing reminders and simple check-ins, while providing caregivers with access to wellbeing information.

**Course:** COMP826 Mobile Systems Development  
**Institution:** Auckland University of Technology (AUT)  
**Assessment:** Milestone 2 — Prototype, Evaluation and Recommendations  
**Developer:** Laina Hende

---

## 1. Project Overview

The Elderly Wellbeing Check-in System is a mobile application designed to support older adults living independently while providing reassurance to their caregivers.

Rather than relying on wearable devices, continuous monitoring or the collection of detailed medical information, the system provides a simple approach based on scheduled wellbeing reminders and one-touch check-ins.

The application provides two role-based interfaces within a single mobile application:

- **Elderly users:** Receive scheduled reminders, complete wellbeing check-ins and review their check-in history.
- **Caregivers:** Monitor wellbeing information, manage reminder schedules and review completed or missed check-ins.

The prototype uses React Native and Expo for cross-platform development, with Firebase Authentication and Cloud Firestore providing authentication, data storage and synchronisation.

The system is intended as an academic prototype and is not a replacement for medical monitoring or emergency services.

---

## 2. Key Features

### Elderly Dashboard

- One-touch wellbeing confirmation using the **I'M OK ✓** button.
- Current wellbeing status indicating whether a check-in has been completed today.
- Display of the next scheduled reminder.
- Local notifications for scheduled wellbeing reminders.
- Check-in history displaying completed and missed records.
- Simple, accessible interface with large buttons and readable text.

### Caregiver Dashboard

- View the linked elderly user's profile.
- Monitor the elderly user's current wellbeing status.
- View the next scheduled reminder and most recent check-in.
- Add, remove and save reminder times.
- Review completed and missed check-in history.
- Receive updates to check-in information through Firestore real-time listeners.
- Receive local notifications for newly detected missed check-ins while the caregiver dashboard is running.

### Authentication and Shared Functionality

- Firebase email and password authentication.
- Role-based navigation for elderly users and caregivers.
- Route protection based on the authenticated user's role.
- Cloud storage of profiles, reminders and check-in records.
- Synchronisation of wellbeing information between users.

---

## 3. Technology Stack

| Technology | Purpose |
| --- | --- |
| React Native | Cross-platform mobile application development |
| Expo SDK 58 | Mobile development and testing environment |
| TypeScript | Type-safe application implementation |
| Expo Router | File-based navigation |
| Firebase Authentication | Email and password authentication |
| Cloud Firestore | Database storage and synchronisation |
| Expo Notifications | Local device notifications |
| Jest | Automated testing |
| React Native Testing Library | UI component and interaction testing |
| Git and GitHub | Version control and development artefact management |

---

## 4. Project Structure

The application uses a Model-View-Presenter (MVP)-inspired architecture to separate interface components, application logic and supporting services.

The main project directories are organised as follows:

```text
elderly-wellbeing-app/
├── __tests__/                 # Automated test suites
├── src/
│   ├── app/                   # Application screens and navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── elderly/
│   │   │   ├── dashboard.tsx
│   │   │   └── history.tsx
│   │   └── caregiver/
│   │       ├── dashboard.tsx
│   │       ├── history.tsx
│   │       └── schedule.tsx
│   ├── components/            # Reusable interface components
│   ├── config/
│   │   └── firebase.ts        # Firebase client configuration
│   ├── managers/              # Application and business logic
│   ├── models/                # Data models, where applicable
│   ├── presenters/            # Presentation and authentication logic
│   └── services/              # Database and notification services
├── package.json
├── tsconfig.app.json
└── README.md
```

### Architecture Components

**Views:** React Native screens responsible for displaying information and handling user interactions.

**Presenters:** Coordinate presentation-related operations, including authentication.

**Managers:** Implement application logic for wellbeing check-ins, reminder scheduling and missed-check-in processing.

**Services:** Provide access to Firebase and device notification functionality.

The implementation is inspired by MVP rather than a strict implementation of the pattern, as some application logic and state management remain within React components.

---

## 5. Prerequisites

Before installing the project, ensure the following are available:

- Node.js and npm
- Git
- A code editor, such as Visual Studio Code
- An internet connection

The application can be evaluated using one of the following environments:

- **Physical Android or iOS device using Expo Go** — recommended.
- **Android Emulator** using Android Studio — suitable if a physical device is unavailable.
- **iOS Simulator** using Xcode — available on macOS only.

The project uses **Expo SDK 58**.

> **Important:** The web platform is not supported by this prototype. Evaluation should be performed using a physical mobile device or mobile emulator/simulator.

A physical device is recommended where possible because notification behaviour is most representative on real mobile hardware.

---

## 6. Installation and Execution

### Step 1: Clone the Repository

Open a terminal and clone the GitHub repository:

```bash
git clone https://github.com/lainahende/COMP826-Elderly-Wellbeing-App.git
```

Navigate into the project:

```bash
cd COMP826-Elderly-Wellbeing-App
```

### Step 2: Install Dependencies

Install the project dependencies:

```bash
npm install
```

The project dependencies are defined in `package.json` and configured for Expo SDK 58.

An optional compatibility check can be performed using:

```bash
npx expo-doctor@latest
```

### Step 3: Firebase Configuration

The application connects to an existing Firebase project configured for this prototype.

Firebase Authentication and Cloud Firestore are used to support authentication, user profiles, check-in records and reminder schedules.

The Firebase client configuration is stored in:

```text
src/config/firebase.ts
```

Evaluators do not need to create a separate Firebase project, provided the existing configuration remains available and accessible.

The Firebase project must have:

- Email/password authentication enabled.
- Cloud Firestore enabled.
- Appropriate security rules configured.
- Demonstration elderly and caregiver accounts.

The Firebase configuration contains client-side project identifiers. It does not provide administrator access to Firebase.

Firebase administrator credentials and service-account private keys are not included in the repository.

### Step 4: Start the Expo Development Server

Start the application with:

```bash
npx expo start
```

The terminal will display a QR code and commands for opening the application.

If cache-related issues occur, restart Expo using:

```bash
npx expo start -c
```

---

### Option A: Physical Mobile Device — Recommended

Install **Expo Go** on the Android or iOS device.

Start the Expo development server:

```bash
npx expo start
```

#### Android

1. Open Expo Go.
2. Select the option to scan a QR code.
3. Scan the QR code displayed in the terminal.
4. The application should open in Expo Go.

#### iOS

When using Expo Go on a physical iOS device, the Expo CLI and Expo Go application may need to be signed into the same Expo account.

Check the Expo account currently being used by the CLI:

```bash
npx expo whoami
```

If no account is logged in, run:

```bash
npx expo login
```

Complete the browser-based login when prompted.

The same Expo account should also be signed into Expo Go on the iOS device.

If browser-based login does not open correctly on Windows, the alternative device login flow can be used:

```bash
npx eas-cli@latest login --device
```

After logging in, confirm the CLI account:

```bash
npx expo whoami
```

Then restart Expo if required:

```bash
npx expo start -c
```

Scan the QR code using the iPhone camera or Expo Go and open the project.

The mobile device and development computer should normally be connected to the same network.

If local network connectivity prevents the device from reaching the development server, Expo can be started in tunnel mode:

```bash
npx expo start --tunnel
```

---

### Option B: Android Emulator — No Physical Phone Required

If a physical mobile device is unavailable, the application can be evaluated using an Android Emulator.

Requirements:

- Android Studio
- Android SDK
- A configured Android Virtual Device

Steps:

1. Open Android Studio.
2. Start an Android Virtual Device.
3. Open the project directory in a terminal.
4. Start Expo:

```bash
npx expo start
```

5. When the Expo development server is running, press:

```text
a
```

Expo should attempt to open the project on the running Android Emulator.

This is the recommended alternative when a physical mobile device is unavailable.

Some notification behaviour may differ from testing on a physical device.

---

### Option C: iOS Simulator — macOS Only

If evaluating the application on macOS, an iOS Simulator can be used if Xcode is installed.

Start Expo:

```bash
npx expo start
```

When the development server is running, press:

```text
i
```

Expo should open the application in the available iOS Simulator.

The iOS Simulator is not available on Windows.

---

### Supported Evaluation Platforms

The prototype is intended for mobile evaluation only.

Supported environments include:

- Physical Android device
- Physical iOS device
- Android Emulator
- iOS Simulator

**Web browser execution is not supported.**

---

## 7. Demonstration Accounts

The prototype uses Firebase Authentication to manage elderly and caregiver accounts.

Demonstration accounts have been created for evaluating the application and are linked through Cloud Firestore.

| Account | Role | Purpose |
| --- | --- | --- |
| Elderly demonstration account | `elderly` | Wellbeing reminders and check-ins |
| Caregiver demonstration account | `caregiver` | Monitoring and reminder management |

**Demonstration login credentials will be provided separately through an approved course submission method.**

No passwords or private authentication credentials are stored in this repository.

### Account Linking

The application uses user profile documents in the Firestore `users` collection.

Each profile document corresponds to an authenticated Firebase user.

The caregiver profile includes a reference to the linked elderly user's UID through the `elderlyUserId` field.

This allows the caregiver to access the appropriate wellbeing information and reminder schedule, subject to Firestore security rules.

Account registration and automatic caregiver linking are not currently provided as public-facing application features.

---

## 8. Running Automated Tests

Automated testing was implemented using Jest and React Native Testing Library.

### Run All Tests

Run all automated tests using:

```bash
npm test -- --runInBand
```

The final prototype contains:

- **12 test suites**
- **124 automated tests**

At the time of final verification, all 124 tests passed successfully.

### Run Individual Test Suites

For example, to test the elderly dashboard:

```bash
npm test -- ElderlyDashboard --runInBand
```

To test the caregiver reminder schedule:

```bash
npm test -- CaregiverSchedule --runInBand
```

To test the caregiver history:

```bash
npm test -- CaregiverHistory --runInBand
```

### TypeScript Validation

Run the TypeScript compiler without generating output files:

```bash
npx tsc --noEmit -p tsconfig.app.json
```

### Expo Compatibility Validation

Expo dependency compatibility can be checked using:

```bash
npx expo-doctor@latest
```

### Testing Coverage

Automated tests have been developed for functionality including:

- Login validation and authentication
- Role-based navigation
- Wellbeing check-in submission
- Duplicate submission prevention
- Elderly and caregiver dashboard behaviour
- Check-in history
- Reminder management and validation
- Missed-check-in detection
- Notification permission and scheduling behaviour
- Firestore service operations
- Real-time updates and notification handling

Tests use mocked dependencies where appropriate to verify application behaviour independently of live Firebase services.

Successful automated tests do not replace end-to-end testing on actual mobile devices.

---

## 9. Prototype Demonstration

The following workflows demonstrate the main functionality of the system.

### 9.1 Authentication and Role-Based Navigation

1. Launch the application.
2. Enter the demonstration account credentials.
3. Select **Log In**.
4. The application authenticates the account through Firebase Authentication.
5. The associated user profile is retrieved from Firestore.
6. The application navigates to the elderly or caregiver dashboard based on the account's role.

### 9.2 Elderly Wellbeing Check-in

1. Sign in using the elderly demonstration account.
2. View the current wellbeing status and next scheduled check-in.
3. Select **I'M OK ✓** to confirm wellbeing.
4. The application saves a completed check-in record to Firestore.
5. The dashboard updates to show that a check-in has been completed today.
6. Select **View Check-in History** to review stored records.

### 9.3 Caregiver Monitoring

1. Sign in using the caregiver demonstration account.
2. View the linked elderly user's profile.
3. Review the current wellbeing status.
4. View the next scheduled reminder and latest check-in.
5. Open **View Check-in History** to review completed and missed records.

### 9.4 Reminder Management

1. Sign in using the caregiver account.
2. Select **Manage Reminder Schedule**.
3. Enter a reminder time using the 24-hour `HH:mm` format.
4. Select **Add**.
5. Add or remove additional reminder times as required.
6. Select **Save Schedule**.
7. The updated schedule is stored in Firestore.

When the elderly application loads and retrieves its reminder schedule, it requests notification permission and schedules local reminders where permission has been granted.

### 9.5 Synchronisation Between Users

To demonstrate Firestore synchronisation, use two devices or application sessions authenticated using the linked demonstration accounts.

This could include:

- Two physical mobile devices
- A physical device and Android Emulator
- A physical device and iOS Simulator
- Two separate supported application sessions

To demonstrate synchronisation:

1. Open the caregiver dashboard and allow the initial data to load.
2. Open the elderly dashboard using the linked elderly account.
3. Complete a wellbeing check-in.
4. Return to the caregiver dashboard.
5. Verify that the updated check-in information is displayed.
6. Open the caregiver history to review the completed record.

This demonstrates communication of wellbeing information between the two roles using Firestore.

### 9.6 Missed Check-ins and Notifications

The prototype detects overdue scheduled check-ins using the `MissedCheckInManager`.

The manager compares configured reminder times against completed check-in records and applies a 30-minute grace period before recording a missed check-in.

Missed records are stored in Firestore and can be displayed in check-in history.

The caregiver dashboard subscribes to check-in changes and can trigger a local notification when it detects a newly added missed-check-in record after the initial snapshot.

**Important limitation:** This is not a guaranteed remote push notification service. Missed-check-in detection and caregiver notifications depend on relevant application processing. Notifications may not be delivered when the caregiver application is closed or inactive.

---

## 10. Firestore Data Storage

Cloud Firestore stores the information needed to support wellbeing reminders, user profiles and check-in history.

The main collections are:

| Collection | Purpose |
| --- | --- |
| `users` | Stores user profiles, roles and caregiver–elderly account relationships |
| `reminders` | Stores scheduled wellbeing reminder times |
| `checkIns` | Stores completed and missed wellbeing check-in records |

Completed check-ins contain information such as the elderly user's identifier, completion status and timestamp.

Missed check-in records also support identifying the scheduled date and time associated with the missed reminder.

Firestore security rules should ensure that users can only access records for which they are authorised.

---

## 11. Known Limitations

The Elderly Wellbeing Check-in System is a functional academic prototype with the following limitations:

- A caregiver is currently limited to one linked elderly account.
- Account creation and caregiver linking require setup outside the normal application interface.
- The application requires network connectivity for Firebase authentication and cloud synchronisation.
- Reminders use local device notifications rather than a comprehensive cloud notification system.
- Missed-check-in processing is dependent on application execution and is not guaranteed to occur when all devices are inactive.
- Caregiver notifications are not guaranteed when the caregiver application is closed.
- Notification behaviour may vary between physical devices and emulators/simulators.
- The web platform is not supported.
- The system does not integrate with emergency services, medical providers or wearable devices.
- The application has not been validated for use as a medical or emergency response system.

The prototype is designed to demonstrate the feasibility of a simple, privacy-conscious wellbeing check-in workflow.

---

## 12. Future Improvements

Further development could include:

- In-app account registration and caregiver linking.
- Server-side missed-check-in detection using Firebase Cloud Functions or a scheduled backend process.
- Firebase Cloud Messaging for more reliable remote caregiver notifications.
- Improved offline operation and synchronisation recovery.
- Additional accessibility options and personalisation.
- Formal usability testing with representative older adults.
- Support for caregivers managing multiple elderly accounts.
- Continuous integration and automated deployment workflows.
- Expanded testing across a wider range of Android and iOS devices.

These improvements would increase the system's reliability and suitability for use beyond an academic prototype.

---

## 13. Development and Version Control

Git and GitHub were used to manage the implementation and development artefacts.

Development followed a hybrid Scrum and Kanban approach, with functionality implemented incrementally, tested and refined.

The repository contains application source code, configuration files and automated tests.

The submitted `main` branch represents the final prototype developed for Milestone 2.


**Developer:** Laina Hende  
**Project:** Elderly Wellbeing Check-in System
