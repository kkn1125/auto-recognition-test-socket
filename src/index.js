import uWS from "uWebSockets.js";
import { HOST, PORT } from "./util/global.js";
import { v4 } from "uuid";
import ejs from "ejs";

import fs from "fs";
import path from "path";

const users = new Map();

const app = uWS
  ./*SSL*/ App({
    // key_file_name: "misc/key.pem",
    // cert_file_name: "misc/cert.pem",
    // passphrase: "1234",
  })
  .ws("/*", {
    /* Options */
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 10,
    /* Handlers */
    upgrade: (res, req, context) => {
      console.log(
        "An Http connection wants to become WebSocket, URL: " +
          req.getUrl() +
          "!"
      );

      /* Keep track of abortions */
      const upgradeAborted = { aborted: false };

      /* You MUST copy data out of req here, as req is only valid within this immediate callback */
      req.forEach((key, value) => {
        console.log(key, "=", value);
      });
      const url = req.getUrl();
      const secWebSocketKey = req.getHeader("sec-websocket-key");
      const secWebSocketProtocol = req.getHeader("sec-websocket-protocol");
      const secWebSocketExtensions = req.getHeader("sec-websocket-extensions");

      /* Simulate doing "async" work before upgrading */
      setTimeout(() => {
        console.log(
          "We are now done with our async task, let's upgrade the WebSocket!"
        );

        if (upgradeAborted.aborted) {
          console.log("Ouch! Client disconnected before we could upgrade it!");
          /* You must not upgrade now */
          return;
        }

        /* This immediately calls open handler, you must not use res after this call */
        res.upgrade(
          {
            url: url,
            key: secWebSocketKey,
          },
          /* Use our copies here */
          secWebSocketKey,
          secWebSocketProtocol,
          secWebSocketExtensions,
          context
        );
      }, 1000);

      /* You MUST register an abort handler to know if the upgrade was aborted by peer */
      res.onAborted(() => {
        /* We can simply signal that we were aborted */
        upgradeAborted.aborted = true;
      });
    },
    open: async (ws) => {
      if (!users.has(ws)) {
        const userData = {
          socket: ws,
          id: v4(),
        };
        users.set(ws, userData);
        ws.subscribe("global");
        const page = await renderFile("pages/index");
        const base64 = Buffer.from(page).toString("base64");
        const convert = base64
          .split("")
          .map((str) => String.fromCharCode(str.charCodeAt(0) + 1))
          .join("");

        ws.send(
          convert +
            `!@#dt,return Base64.decode(dt.split("").map((str) => {return String.fromCharCode(str.charCodeAt(0) - 1);}).join(""))`
        );
      }
      console.log(`현재 사용자 현황: ${users.get(ws).id}, ${users.size}명`);
      console.log("A WebSocket connected with URL: " + ws.url);
    },
    message: (ws, message, isBinary) => {
      /* Ok is false if backpressure was built up, wait for drain */
      if (isBinary) {
      } else {
        console.log(message);
        let ok = ws.send(message, isBinary);
      }
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      console.log("WebSocket closed");
    },
  })
  .any("/*", (res, req) => {
    renderFile("pages/layout/template", res);
  })
  .listen(HOST, PORT, (token) => {
    if (token) {
      console.log(
        "Listening to port " + PORT,
        "url is " + "http://" + HOST + ":" + PORT
      );
      console.log(
        "Listening to port " + PORT,
        "url is " + "ws://" + HOST + ":" + PORT
      );
    } else {
      console.log(
        "Failed to listen to port " + PORT,
        "url is " + "ws://" + HOST + ":" + PORT
      );
    }
  });

async function renderFile(target, res) {
  const filePath = path.join(path.resolve(), "src", `${target}.html`);
  console.log(filePath);
  const rend = ejs.renderFile(
    filePath,
    { name: "kimson" },
    { delimiter: "%", openDelimiter: "<", closeDelimiter: ">" }
  );

  if (res) {
    res
      .writeStatus("200 OK")
      .writeHeader("Some", "Value")
      .write(await rend);
    res.end();
  } else {
    return await rend;
  }
}
