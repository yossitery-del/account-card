import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {doc, setDoc} from "firebase/firestore";

const PROJECT_ID = "account-card-rules-test";

describe("Firestore Rules", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve("firestore.rules"), "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("חוסם כתיבת קליינט ל-entries", async () => {
    const db = testEnv.authenticatedContext("uid-owner").firestore();
    const entryRef = doc(db, "accountCards/card-a/entries/entry-a");

    await expect(
      assertFails(
        setDoc(entryRef, {
          title: "כתיבה אסורה",
          amount: 10,
          status: "pending",
        })
      )
    ).resolves.toBeDefined();
  });
});
