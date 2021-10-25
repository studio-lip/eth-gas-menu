const { menubar } = require("menubar");

const mb = menubar({
  dir: __dirname,
  index: "https://etherscan.io/gastracker",
  preloadWindow: true,
});

mb.on("ready", () => {
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
  content.reload();
  setInterval(content.reload, 1000);
  content.on("did-finish-load", () => {
    console.log("load");
    content.insertCSS("header,footer {display: none!important;}", {
      cssOrigin: "user",
    });
  });
});
