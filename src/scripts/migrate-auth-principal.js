import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const applyChanges = process.argv.includes("--apply");
const client = new MongoClient(process.env.MONGODB_URI);

function getUserFilter(userId) {
  const filters = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return { $or: filters };
}

function getSessionUserFilter(userId) {
  const filters = [{ userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ userId: new ObjectId(userId) });
  }

  return { $or: filters };
}

try {
  await client.connect();

  const database = client.db();
  const users = database.collection("user");
  const sessions = database.collection("session");
  const profiles = database.collection("userprofiles");
  const profileRecords = await profiles
    .find({}, { projection: { userId: 1, role: 1, isActive: 1 } })
    .toArray();

  let matched = 0;
  let changed = 0;
  let missingUsers = 0;
  let bannedUsers = 0;
  const roles = {};

  for (const profile of profileRecords) {
    const user = await users.findOne(getUserFilter(profile.userId));

    if (!user) {
      missingUsers += 1;
      continue;
    }

    matched += 1;

    const update = {
      role: profile.role || user.role || "user",
      banned: profile.isActive === false,
      updatedAt: new Date(),
    };

    if (profile.isActive === false) {
      update.banReason =
        user.banReason || "Migrated from inactive user profile";
      update.banExpires = null;
    } else {
      update.banReason = null;
      update.banExpires = null;
    }

    roles[update.role] = (roles[update.role] || 0) + 1;
    if (update.banned) bannedUsers += 1;

    const needsUpdate =
      user.role !== update.role ||
      Boolean(user.banned) !== update.banned ||
      (update.banned && user.banReason !== update.banReason);

    if (applyChanges && update.banned) {
      await sessions.deleteMany(getSessionUserFilter(profile.userId));
    }

    if (!needsUpdate) continue;

    changed += 1;

    if (applyChanges) {
      await users.updateOne(getUserFilter(profile.userId), { $set: update });
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? "apply" : "dry-run",
        profiles: profileRecords.length,
        matched,
        changed,
        missingUsers,
        bannedUsers,
        roles,
      },
      null,
      2,
    ),
  );

  if (!applyChanges) {
    console.log(
      "Dry run only. Re-run with --apply after reviewing the counts.",
    );
  }
} finally {
  await client.close();
}
