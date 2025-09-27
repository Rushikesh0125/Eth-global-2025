const admin = require("firebase-admin");
const path = require("path");

class FirebaseService {
  constructor() {
    if (!admin.apps.length) {
      const serviceAccount = require(path.resolve("./serviceAccount.json"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    this.db = admin.firestore();
    this.nullifierCollection = this.db.collection("zk_express_nullifiers");
    this.userCollection = this.db.collection("zk_express_users");
  }

  /**
   * Add a userId (nullifier not known yet).
   */
  async addUser(userId) {
    await this.userCollection.doc(userId).set(
      {
        userId,
        nullifier: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { userId };
  }

  /**
   * Once nullifier is calculated, attach it to a userId.
   * - Updates user doc with nullifier
   * - Updates nullifier doc with array of userIds
   */
  async addNullifierToUser(userId, nullifier) {
    // update nullifier → add user
    await this.nullifierCollection.doc(nullifier).set(
      {
        nullifier,
        userIds: admin.firestore.FieldValue.arrayUnion(userId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // update user → add nullifier
    await this.userCollection.doc(userId).set(
      {
        nullifier,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { linked: true, userId, nullifier };
  }

  /**
   * Get all userIds for a nullifier.
   */
  async getUserIds(nullifier) {
    const doc = await this.nullifierCollection.doc(nullifier).get();
    if (!doc.exists) return [];
    return doc.data().userIds || [];
  }

  /**
   * Get nullifier of a user.
   */
  async getNullifier(userId) {
    const doc = await this.userCollection.doc(userId).get();
    if (!doc.exists) return null;
    return doc.data().nullifier;
  }
}

module.exports = FirebaseService;
