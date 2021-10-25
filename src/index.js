const { protocol, session } = require("electron");
const { menubar } = require("menubar");
// const { fetch } = require("electron-fetch").default;
const path = require("path");
// const remote = require('electron').remote;
// const fs = require('fs');

const mb = menubar({
  dir: __dirname,
  index: "https://etherscan.io/gastracker",
  preloadWindow: true,
});

mb.on("ready", () => {
  const { net } = require("electron");
  const content = mb.window.webContents;
  try {
    content.debugger.attach("1.3");
  } catch (err) {
    console.log("Debugger attach failed: ", err);
  }

  content.debugger.on("detach", (event, reason) => {
    console.log("Debugger detached due to: ", reason);
  });

  content.debugger.on("message", (event, method, params) => {
    if (method === "Network.responseReceived") {
      if (
        params.response.url.startsWith(
          "https://etherscan.io/autoUpdateGasTracker"
        )
      ) {
        content.debugger
          .sendCommand("Network.getResponseBody", {
            requestId: params.requestId,
          })
          .then((response) => {
            const body = response.body;
            console.log(body.slice(0, 20));
            // const res = JSON.parse(body);
            if (body) {
              const res = JSON.parse(body);
              mb.tray.setTitle(
                `${res.lowPrice} | ${res.avgPrice} | ${res.highPrice}`
              );
            }
          })
          .catch((e) => console.error(e));
      }
    }
  });

  content.debugger.sendCommand("Network.enable");
  // protocol.interceptBufferProtocol("https", (request, result) => {
  //   if (request.url === "http://www.google.com")
  //     return result(content);
  // });
  // session.defaultSession.webRequest.onBeforeRequest(
  //   { urls: ["https://etherscan.io/autoUpdateGasTracker.ashx?*"] },
  //   (details, cb) => {
  //     console.log("URL", details.url);
  //     // if (!details.url.endsWith("&lipapp=true")) {
  //     //   const request = net.request(`${details.url}&lipapp=true`);
  //     //   console.log(request);
  //     //   request.on("response", (response) => {
  //     //     console.log(`STATUS: ${response.statusCode}`);
  //     //     console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
  //     //     response.on("data", (chunk) => {
  //     //       console.log(`BODY: ${chunk}`);
  //     //     });
  //     //     response.on("end", () => {
  //     //       console.log("No more data in response.");
  //     //     });
  //     //   });
  //     //   request.end();
  //     // }
  //   }
  // );
  // console.log(content);
  content.reload();
  // setInterval(content.reload, 1000);
  content.on("did-finish-load", () => {
    console.log("load");
    // content.insertCSS(
    //   fs.readFileSync(path.join(__dirname, "inject.css"), "utf8")
    // );
    content.insertCSS("header,footer {display: none!important;}", { cssOrigin: "user" });
  });
});
