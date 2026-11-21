import "dotenv/config";

import readline from "node:readline";
import { closeMySQL, dbGet, dbRun, dbTransaction, initMySQL } from "../database/mysql.js";
import { initializeDatabaseMySQL } from "../database/init-mysql.js";
import { generateId } from "../utils/id.js";
import { hashPassword } from "../utils/password.js";

class ProvisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProvisionError";
  }
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askPassword(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const mutableRl = rl as readline.Interface & {
    _writeToOutput?: (text: string) => void;
  };
  const originalWriteToOutput = mutableRl._writeToOutput;

  if (mutableRl._writeToOutput) {
    mutableRl._writeToOutput = () => {};
  }

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      if (originalWriteToOutput) {
        mutableRl._writeToOutput = originalWriteToOutput;
      }
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function initializeDatabaseSilently(): Promise<void> {
  const originalLog = console.log;
  console.log = () => {};
  try {
    await initMySQL();
    await initializeDatabaseMySQL();
  } finally {
    console.log = originalLog;
  }
}

async function main(): Promise<void> {
  let email = "";
  while (!email) {
    email = await ask("Admin email: ");
    if (!isValidEmail(email)) {
      console.log("❌ Failed: Email must be a valid email format.");
      email = "";
    }
  }

  let name = "";
  while (name.length < 2) {
    name = await ask("Admin name: ");
    if (name.length < 2) {
      console.log("❌ Failed: Name must be at least 2 characters.");
    }
  }

  let phone = "";
  while (!phone || phone.length > 50) {
    phone = await ask("Admin phone: ");
    if (!phone) {
      console.log("❌ Failed: Phone is required.");
    } else if (phone.length > 50) {
      console.log("❌ Failed: Phone must be at most 50 characters.");
    }
  }

  let password = "";
  while (true) {
    password = await askPassword("Admin password: ");
    if (password.length < 8) {
      console.log("❌ Failed: Password must be at least 8 characters.");
      continue;
    }

    const confirmation = await askPassword("Confirm admin password: ");
    if (password !== confirmation) {
      console.log("❌ Failed: Password entries do not match.");
      continue;
    }
    break;
  }

  const confirmation = await ask('Type "CONFIRM" to create the first admin: ');
  if (confirmation !== "CONFIRM") {
    throw new ProvisionError("Cancelled: CONFIRM was not entered.");
  }

  await initializeDatabaseSilently();

  await dbTransaction(async (connection) => {
    const admin = await dbGet<{ id: string }>(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
      [],
      connection,
    );
    if (admin) {
      throw new ProvisionError("An admin account already exists. Refusing to create another.");
    }

    const existing = await dbGet<{ id: string }>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
      connection,
    );
    if (existing) {
      throw new ProvisionError("A user with this email already exists.");
    }

    const passwordHash = await hashPassword(password);
    await dbRun(
      "INSERT INTO users (id, email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, 'admin')",
      [generateId(), email, name, phone, passwordHash],
      connection,
    );
  });

  console.log(`✅ Admin account created for ${email}. You may now log in.`);
}

try {
  await main();
} catch (error) {
  if (error instanceof ProvisionError) {
    if (error.message === "An admin account already exists. Refusing to create another.") {
      console.log(error.message);
    } else if (error.message === "A user with this email already exists.") {
      console.log(error.message);
    } else {
      console.log(`❌ Failed: ${error.message}`);
    }
  } else {
    console.log("❌ Failed: Unable to provision the admin account.");
  }
  process.exitCode = 1;
} finally {
  await closeMySQL();
}
