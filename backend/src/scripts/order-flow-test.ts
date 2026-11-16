import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import mysql from "mysql2/promise";

/* eslint-disable @typescript-eslint/no-explicit-any */
const TEST_DATABASE = process.env.TEST_DATABASE_NAME || "wardity_test";
if (!TEST_DATABASE.endsWith("_test")) {
  throw new Error("Refusing to run order-flow tests unless the database name ends with _test");
}

const port = 3310 + Math.floor(Math.random() * 200);
const apiPort = 3210 + Math.floor(Math.random() * 200);
const password = process.env.MYSQL_PASSWORD || "";
const mysqlConfig = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password,
};

const whatsappRequests: unknown[] = [];
const capiRequests: unknown[] = [];
let capiMode: "success" | "error" | "timeout" = "success";

const mockServer: Server = createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    if (req.url?.includes("/messages")) {
      whatsappRequests.push(body);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ messages: [{ id: "mock-message" }] }));
      return;
    }
    if (req.url?.includes("/events")) {
      capiRequests.push(body);
      if (capiMode === "timeout") return;
      res.writeHead(capiMode === "success" ? 200 : 400, { "content-type": "application/json" });
      res.end(JSON.stringify(capiMode === "success" ? { events_received: 1 } : { error: "mock failure" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
});

async function request(path: string, init: RequestInit = {}): Promise<{ response: Response; body: any }> {
  const response = await fetch(`http://127.0.0.1:${apiPort}${path}`, init);
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : undefined };
}

async function waitFor(check: () => Promise<boolean>, timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for expected test state");
}

async function startBackend(metaToken = "mock-meta-token"): Promise<ChildProcess> {
  const child = spawn(process.execPath, ["dist/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(apiPort),
      DB_DRIVER: "mysql",
      MYSQL_DATABASE: TEST_DATABASE,
      WHATSAPP_TOKEN: "mock-whatsapp-token",
      WHATSAPP_PHONE_NUMBER_ID: "mock-phone-id",
      WHATSAPP_ORDER_RECIPIENTS: "201000000000",
      WHATSAPP_TEMPLATE_NAME: "mock_order_template",
      WHATSAPP_TEMPLATE_LANG: "ar",
      WHATSAPP_API_BASE_URL: `http://127.0.0.1:${port}`,
      META_PIXEL_ID: metaToken ? "mock-pixel-id" : "",
      META_CAPI_TOKEN: metaToken,
      META_GRAPH_BASE_URL: `http://127.0.0.1:${port}`,
      REQUEST_BODY_LIMIT: "100kb",
      ORDER_NOTIFICATION_TIMEOUT_MS: "500",
      META_CAPI_TIMEOUT_MS: "300",
    },
    stdio: "ignore",
  });
  await waitFor(async () => {
    try {
      return (await fetch(`http://127.0.0.1:${apiPort}/health`)).ok;
    } catch {
      return false;
    }
  }, 12000);
  return child;
}

async function stopBackend(child: ChildProcess): Promise<void> {
  child.kill();
  await new Promise((resolve) => setTimeout(resolve, 300));
}

const tomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const orderBody = {
  shippingAddress: "1 Test Street",
  customerName: "Test Customer",
  paymentMethod: "cash_on_delivery",
  consent: true,
  email: "Test@Example.com",
  phone: "+20 (100) 123-4567",
  sourceUrl: "https://test.invalid/checkout",
  deliveryLocationId: "delivery-el-waha",
  requestedDeliveryDate: tomorrow,
  requestedDeliveryTime: "10:00",
};

async function main(): Promise<void> {
  const admin = await mysql.createConnection(mysqlConfig);
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DATABASE}\``);
  await admin.end();
  await new Promise<void>((resolve) => mockServer.listen(port, "127.0.0.1", resolve));

  let backend = await startBackend();
  try {
    const fixture = await mysql.createConnection({ ...mysqlConfig, database: TEST_DATABASE });
    const productIds = Array.from({ length: 5 }, () => randomUUID());
    for (const [index, productId] of productIds.entries()) {
      await fixture.execute(
        "INSERT INTO products (id, name, price, image, status, stock_quantity) VALUES (?, ?, ?, ?, 'In stock', NULL)",
        [productId, index === 0 ? "Flower\nOne" : `Flower ${index}`, 100 + index, `https://cdn.test/${index}.webp`],
      );
    }
    const outOfStockId = randomUUID();
    const raceProductId = randomUUID();
    await fixture.execute(
      "INSERT INTO products (id, name, price, image, status, stock_quantity) VALUES (?, 'Unavailable', 100, 'https://cdn.test/out.webp', 'Out of stock', 0)",
      [outOfStockId],
    );
    await fixture.execute(
      "INSERT INTO products (id, name, price, image, status, stock_quantity) VALUES (?, 'Last item', 150, 'https://cdn.test/last.webp', 'In stock', 1)",
      [raceProductId],
    );
    await fixture.execute(
      "UPDATE delivery_locations SET delivery_fee = 100, requires_quote = 0, is_active = 1 WHERE id = 'delivery-el-waha'",
    );
    await fixture.end();

    const email = `customer-${randomUUID()}@example.com`;
    const password = "Strong-test-password-123";
    const oversizedArrayStartedAt = Date.now();
    const oversizedArray = await request("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "AddToCart",
        eventId: randomUUID(),
        content_ids: Array.from({ length: 1000 }, (_, index) => `product-${index}`),
        value: 100,
        currency: "EGP",
        consent: true,
      }),
    });
    assert.equal(oversizedArray.response.status, 400);
    assert.ok(Date.now() - oversizedArrayStartedAt < 2000);
    const oversizedBody = await request("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "AddToCart",
        eventId: randomUUID(),
        content_ids: ["product-0"],
        value: 100,
        currency: "EGP",
        consent: true,
        padding: "x".repeat(101 * 1024),
      }),
    });
    assert.equal(oversizedBody.response.status, 413);
    const registered = await request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "Test Customer", phone: "01000000000" }),
    });
    assert.equal(registered.response.status, 201);
    const token = registered.body.data.token as string;
    const headers = { "content-type": "application/json", authorization: `Bearer ${token}` };

    const loggedIn = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(loggedIn.response.status, 200);

    const invalidQuantity = await request("/api/cart/items", {
      method: "POST", headers, body: JSON.stringify({ productId: productIds[0], quantity: 0 }),
    });
    assert.equal(invalidQuantity.response.status, 400);
    const negativeQuantity = await request("/api/cart/items", {
      method: "POST", headers, body: JSON.stringify({ productId: productIds[0], quantity: -1 }),
    });
    assert.equal(negativeQuantity.response.status, 400);

    for (const productId of productIds) {
      const added = await request("/api/cart/items", {
        method: "POST", headers, body: JSON.stringify({ productId, quantity: 1 }),
      });
      assert.equal(added.response.status, 201, JSON.stringify(added.body));
    }
    const order = await request("/api/orders", {
      method: "POST",
      headers,
      body: JSON.stringify({ ...orderBody, total: 1, items: [{ productId: productIds[0], price: 0, quantity: 0 }] }),
    });
    assert.equal(order.response.status, 201, JSON.stringify(order.body));
    assert.equal(order.body.items.length, 5);
    assert.notEqual(order.body.total, 1);
    const orderId = order.body.id as string;

    await waitFor(async () => whatsappRequests.length >= 4 && capiRequests.length >= 1);
    const templateRequest = whatsappRequests[0] as any;
    const parameters = templateRequest.template.components.find((component: any) => component.type === "body").parameters;
    assert.equal(parameters.length, 11);
    assert.equal(parameters[4].text.includes("\n"), false);
    assert.equal(templateRequest.template.components[0].type, "header");
    assert.equal(whatsappRequests.filter((body: any) => body.type === "image").length, 3);
    assert.equal((capiRequests[0] as any).data[0].event_id, orderId);

    const otherRegistration = await request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `other-${randomUUID()}@example.com`, password, name: "Other", phone: "01000000001" }),
    });
    assert.equal(otherRegistration.response.status, 201);
    const otherHeaders = { "content-type": "application/json", authorization: `Bearer ${otherRegistration.body.data.token}` };
    const firstUserCartItem = await request("/api/cart/items", {
      method: "POST", headers, body: JSON.stringify({ productId: productIds[0], quantity: 1 }),
    });
    assert.equal(firstUserCartItem.response.status, 201);
    const firstUser = registered.body.data.user.id as string;
    const cartConnection = await mysql.createConnection({ ...mysqlConfig, database: TEST_DATABASE });
    const [cartRows] = await cartConnection.execute("SELECT id FROM cart_items WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [firstUser]);
    await cartConnection.end();
    const foreignCartItemId = (cartRows as any[])[0].id as string;
    const otherCartMutation = await request(`/api/cart/items/${foreignCartItemId}`, {
      method: "PATCH", headers: otherHeaders, body: JSON.stringify({ quantity: 2 }),
    });
    assert.equal(otherCartMutation.response.status, 404);
    const otherOrderRead = await request(`/api/orders/${orderId}`, { headers: otherHeaders });
    assert.equal(otherOrderRead.response.status, 404);

    const raceAdditions = await Promise.all([
      request("/api/cart/items", { method: "POST", headers, body: JSON.stringify({ productId: raceProductId, quantity: 1 }) }),
      request("/api/cart/items", { method: "POST", headers: otherHeaders, body: JSON.stringify({ productId: raceProductId, quantity: 1 }) }),
    ]);
    assert.deepEqual(raceAdditions.map(({ response }) => response.status).sort(), [201, 201]);
    const concurrentOrders = await Promise.all([
      request("/api/orders", { method: "POST", headers, body: JSON.stringify({ ...orderBody, consent: false }) }),
      request("/api/orders", { method: "POST", headers: otherHeaders, body: JSON.stringify({ ...orderBody, consent: false }) }),
    ]);
    assert.deepEqual(concurrentOrders.map(({ response }) => response.status).sort(), [201, 409]);
    const raceConnection = await mysql.createConnection({ ...mysqlConfig, database: TEST_DATABASE });
    const [raceRows] = await raceConnection.execute("SELECT stock_quantity FROM products WHERE id = ?", [raceProductId]);
    const [raceOrders] = await raceConnection.execute("SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?", [raceProductId]);
    await raceConnection.end();
    assert.equal(Number((raceRows as any[])[0].stock_quantity), 0);
    assert.equal(Number((raceOrders as any[])[0].count), 1);
    const cleanupConnection = await mysql.createConnection({ ...mysqlConfig, database: TEST_DATABASE });
    await cleanupConnection.execute("DELETE FROM cart_items WHERE product_id = ?", [raceProductId]);
    await cleanupConnection.end();

    const outOfStock = await request("/api/cart/items", {
      method: "POST", headers, body: JSON.stringify({ productId: outOfStockId, quantity: 1 }),
    });
    assert.equal(outOfStock.response.status, 409);

    const addCartItem = async () => {
      const added = await request("/api/cart/items", {
        method: "POST", headers, body: JSON.stringify({ productId: productIds[1], quantity: 1 }),
      });
      assert.equal(added.response.status, 201);
    };

    capiMode = "error";
    await addCartItem();
    const errorOrder = await request("/api/orders", { method: "POST", headers, body: JSON.stringify({ ...orderBody, consent: true }) });
    assert.equal(errorOrder.response.status, 201);
    await waitFor(async () => {
      const connection = await mysql.createConnection({ ...mysqlConfig, database: TEST_DATABASE });
      const [rows] = await connection.execute("SELECT capi_status FROM orders WHERE id = ?", [errorOrder.body.id]);
      await connection.end();
      return (rows as any[])[0]?.capi_status === "failed";
    });

    capiMode = "timeout";
    await addCartItem();
    const timeoutOrder = await request("/api/orders", { method: "POST", headers, body: JSON.stringify({ ...orderBody, consent: true }) });
    assert.equal(timeoutOrder.response.status, 201);
    await waitFor(async () => {
      const connection = await mysql.createConnection({ ...mysqlConfig, database: TEST_DATABASE });
      const [rows] = await connection.execute("SELECT capi_status FROM orders WHERE id = ?", [timeoutOrder.body.id]);
      await connection.end();
      return (rows as any[])[0]?.capi_status === "failed";
    });

    await stopBackend(backend);
    backend = await startBackend("");
    await addCartItem();
    const missingOrder = await request("/api/orders", { method: "POST", headers, body: JSON.stringify({ ...orderBody, consent: true }) });
    assert.equal(missingOrder.response.status, 201);
    await waitFor(async () => {
      const connection = await mysql.createConnection({ ...mysqlConfig, database: TEST_DATABASE });
      const [rows] = await connection.execute("SELECT capi_status FROM orders WHERE id = ?", [missingOrder.body.id]);
      await connection.end();
      return (rows as any[])[0]?.capi_status === "skipped";
    });

    for (let index = 0; index < 21; index++) {
      const limited = await request("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "wrong-password" }),
      });
      if (index === 20) assert.equal(limited.response.status, 429);
    }
    console.log(`Order-flow tests passed against isolated database ${TEST_DATABASE}`);
  } finally {
    await stopBackend(backend);
    mockServer.close();
  }
}

main().catch((error) => {
  console.error(error);
  mockServer.close();
  process.exitCode = 1;
});
