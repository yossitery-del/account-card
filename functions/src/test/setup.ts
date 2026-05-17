process.env.GCLOUD_PROJECT ??= "account-card-test";
process.env.FIREBASE_CONFIG ??= JSON.stringify({
  projectId: process.env.GCLOUD_PROJECT,
});
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
