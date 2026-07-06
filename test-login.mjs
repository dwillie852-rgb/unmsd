import http from "node:http";

const req = http.request(
  "http://localhost:4173/api/admin/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  },
  (res) => {
    console.log("STATUS:", res.statusCode);
    console.log("HEADERS:", res.headers);
    res.on("data", (d) => process.stdout.write(d));
  }
);
req.write(JSON.stringify({ username: "admin", password: "local-admin-password" }));
req.end();
