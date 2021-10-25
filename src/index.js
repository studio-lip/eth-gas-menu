const { menubar } = require("menubar");
const { Menu } = require("electron");

const mb = menubar({
  dir: __dirname,
  index: "https://etherscan.io/gastracker",
  preloadWindow: true,
  showDockIcon: false,
  showOnRightClick: true,
});

let lastID = null;
let lastGas = null;
let detailedTitle = true;

function setTitle() {
  const title = detailedTitle
    ? `${lastGas.lowPrice} | ${lastGas.avgPrice} | ${lastGas.highPrice}`
    : `${lastGas.avgPrice}`;
  mb.tray.setTitle(title);
}

mb.on("ready", () => {
  mb.app.dock.hide();
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show Etherscan", click: () => mb.showWindow() },
    {
      label: "Show Details",
      type: "checkbox",
      checked: detailedTitle,
      click: () => {
        detailedTitle = !detailedTitle;
        setTitle();
      },
    },
    { label: "Quit", role: "quit" },
  ]);
  // mb.tray.setToolTip("Right click to quit.");
  mb.tray.setContextMenu(contextMenu);
  mb.tray.setTitle("Loading...");
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
    if (method === "Network.loadingFinished") {
      if (params.requestId === lastID) {
        content.debugger
          .sendCommand("Network.getResponseBody", {
            requestId: params.requestId,
          })
          .then((response) => {
            const body = response.body;
            if (body) {
              lastGas = JSON.parse(body);
              setTitle();
            }
          })
          .catch((e) => console.error(e));
      }
    }
    if (method === "Network.responseReceived") {
      if (
        params.response.url.startsWith(
          "https://etherscan.io/autoUpdateGasTracker"
        )
      ) {
        lastID = params.requestId;
      }
    }
  });
  content.debugger.sendCommand("Network.enable");
  content.reload();
  setInterval(() => content.reload(), 120000);
  content.on("did-finish-load", () => {
    content.insertCSS("header,footer {display: none!important;}", {
      cssOrigin: "user",
    });
  });
});
