document.addEventListener("DOMContentLoaded", () => {
  try {
    const server = `ws://${window.location.host}`;
    console.log("Starting websocket server " + server);
    // Connect to the WebSocket server
    const socket = new WebSocket(server);

    // Listen for messages from the server
    socket.addEventListener("message", (event) => {
      if (event.data === "reload") {
        console.log("Reload triggered by server.");
        window.location.reload(true);
      }
      if (event.data === "reload-css") {
        console.log("Css Reload triggered by server.");
        reloadVersionedStylesheets();
      }
    });

    // Find and reload all link tags with stylesheets containing 'v=' in the href
    function reloadVersionedStylesheets() {
      removeDuplicatedLinks();
      const links = document.querySelectorAll(
        'link[rel="stylesheet"][data-reload]'
      );

      links.forEach((link) => {
        const href = link.getAttribute("href");
        const reload = link.dataset.reload;

        // Check if the href contains 'v='
        if (href && reload) {
          // Create a new URL with a timestamp to force reload
          const newHref = href.split("?")[0] + "?v=" + new Date().getTime();

          // Create a new link element
          const newLink = document.createElement("link");
          newLink.rel = "stylesheet";
          newLink.href = newHref;
          newLink.dataset.reload = reload;
          setTimeout(() => link.remove(), 500);
          // Append the new link element to the head
          document.head.appendChild(newLink);
        }
      });
    }

    function removeDuplicatedLinks() {
      const links = document.querySelectorAll(
        'link[rel="stylesheet"][data-reload]'
      );
      const groupedLinks = {};

      links.forEach((link) => {
        const reloadValue = link.getAttribute("data-reload");
        if (!groupedLinks[reloadValue]) {
          groupedLinks[reloadValue] = [];
        }
        groupedLinks[reloadValue].push(link);
      });

      Object.values(groupedLinks).forEach((group) => {
        group.slice(0, -1).forEach((link) => link.remove());
      });
    }
  } catch (e) {}
});
