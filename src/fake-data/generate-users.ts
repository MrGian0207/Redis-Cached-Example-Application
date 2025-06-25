import { faker } from "@faker-js/faker";
import * as fs from "fs";

const TOTAL = 10000;

function escape(str: string) {
  return str.replace(/'/g, "''");
}

const users: string[] = [];

for (let i = 0; i < TOTAL; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const name = `${firstName} ${lastName}`;
  const email = faker.internet.email({ firstName, lastName });
  users.push(`('${escape(email)}', '${escape(name)}')`);
}

const sql = `INSERT INTO "User" (email, name) VALUES\n${users.join(",\n")};`;

fs.writeFileSync("insert_users.sql", sql);

console.log("Đã sinh xong 10.000 user vào file insert_users.sql");
