require("dotenv").config({ path: ".env.local", quiet: true });

import mongoose from "mongoose";

function normalizeName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Explicitly map the existing Microsoft Co. label to Microsoft.
function canonicalVendorKey(name) {
  const normalized = normalizeName(name);

  if (normalized === "microsoft co.") {
    return "microsoft";
  }

  return normalized;
}

function displayVendorName(name, key) {
  const knownNames = {
    microsoft: "Microsoft",
    ubisoft: "Ubisoft",
    "slack technologies": "Slack Technologies",
    "figma inc.": "Figma Inc.",
    "github inc.": "GitHub Inc.",
    "notion labs": "Notion Labs",
    atlassian: "Atlassian",
    linear: "Linear",
  };

  return knownNames[key] ?? String(name).trim();
}

async function main() {
  const applyChanges = process.argv.includes("--apply");

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in .env.local");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("Database connection is unavailable.");
  }

  const applicationsCollection = db.collection("applications");
  const vendorsCollection = db.collection("vendors");

  const applications = await applicationsCollection
    .find({})
    .sort({ organizationId: 1, _id: 1 })
    .toArray();

  const vendors = await vendorsCollection.find({}).toArray();

  const vendorMap = new Map();

  for (const vendor of vendors) {
    const key = canonicalVendorKey(vendor.normalizedName ?? vendor.name);

    const mapKey = `${vendor.organizationId}:${key}`;

    if (!vendorMap.has(mapKey)) {
      vendorMap.set(mapKey, vendor);
    }
  }

  const plans = [];
  let skipped = 0;

  for (const application of applications) {
    if (application.vendorId) {
      skipped++;
      continue;
    }

    if (!application.organizationId || !application.vendor?.trim()) {
      throw new Error(
        `Application ${application._id} is missing organizationId or vendor.`,
      );
    }

    const key = canonicalVendorKey(application.vendor);
    const mapKey = `${application.organizationId}:${key}`;

    let vendor = vendorMap.get(mapKey);
    let createVendor = false;

    if (!vendor) {
      createVendor = true;

      vendor = {
        organizationId: application.organizationId,
        name: displayVendorName(application.vendor, key),
        normalizedName: key,
        status: "active",
        __planned: true,
      };

      // Reuse the planned entry for other applications with this vendor.
      vendorMap.set(mapKey, vendor);
    }

    plans.push({
      application,
      vendor,
      createVendor,
    });
  }

  console.log(`Mode: ${applyChanges ? "APPLY" : "DRY RUN"}`);
  console.log(`Applications found: ${applications.length}`);
  console.log(`Applications already linked: ${skipped}`);
  console.log(`Applications to link: ${plans.length}`);

  const createdKeys = new Set();

  for (const plan of plans) {
    const { application, vendor } = plan;

    console.log(
      `${applyChanges ? "PLAN" : "PREVIEW"} | ${application.name} | ` +
        `${application.vendor} -> ${vendor.name} | ` +
        `organization=${application.organizationId}`,
    );

    if (!applyChanges) {
      continue;
    }

    const key = canonicalVendorKey(application.vendor);
    const mapKey = `${application.organizationId}:${key}`;

    let actualVendor = vendorMap.get(mapKey);

    if (actualVendor?.__planned) {
      // Upsert by organization and normalized vendor name.
      await vendorsCollection.updateOne(
        {
          organizationId: application.organizationId,
          normalizedName: key,
        },
        {
          $setOnInsert: {
            organizationId: application.organizationId,
            name: displayVendorName(application.vendor, key),
            normalizedName: key,
            status: "active",
            createdAt: new Date(),
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );

      actualVendor = await vendorsCollection.findOne({
        organizationId: application.organizationId,
        normalizedName: key,
      });

      if (!actualVendor) {
        throw new Error(`Could not create or find vendor: ${key}`);
      }

      vendorMap.set(mapKey, actualVendor);
      createdKeys.add(mapKey);
    }

    if (!actualVendor?._id) {
      throw new Error(`Vendor ID unavailable for ${application.name}`);
    }

    const result = await applicationsCollection.updateOne(
      {
        _id: application._id,
        organizationId: application.organizationId,
        vendorId: { $exists: false },
      },
      {
        $set: { vendorId: actualVendor._id },
      },
    );

    if (result.modifiedCount === 1) {
      console.log(`LINKED | ${application.name} -> ${actualVendor.name}`);
    } else {
      const latest = await applicationsCollection.findOne({
        _id: application._id,
        organizationId: application.organizationId,
      });

      if (!latest?.vendorId) {
        throw new Error(`Failed to link application ${application._id}`);
      }

      console.log(`ALREADY LINKED | ${application.name}`);
    }
  }

  if (applyChanges) {
    const remaining = await applicationsCollection.countDocuments({
      vendorId: { $exists: false },
    });

    console.log(`Vendor records created or reused: ${createdKeys.size}`);
    console.log(`Applications still missing vendorId: ${remaining}`);

    if (remaining > 0) {
      console.warn(
        "Some applications remain unlinked. Review the records before proceeding.",
      );
    } else {
      console.log("Migration verification passed.");
    }
  } else {
    console.log("\nDry run complete. No database records were modified.");
    console.log("Review the preview before running with --apply.");
  }
}

main()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
