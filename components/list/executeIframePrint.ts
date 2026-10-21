// components/list/executeIframePrint.ts
import type { InventoryItem } from "@/types/inventory";

/**
 * Prints the label through a temporary iframe.
 *
 * Kept out of `ListSection` because it manipulates a separate document and has
 * no React state — the orchestrator only forwards the selected item.
 */
export function executeIframePrint(item: InventoryItem) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const qrCodeUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/qrcode/view?id=${item.id}`;

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Imprimir Etiqueta</title>
        <style>
          @page { size: auto; margin: 0mm; }
          html, body {
            margin: 0; padding: 0;
            background: #ffffff !important; color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh; width: 100vw;
          }
          .print-label {
            background: #ffffff !important; color: #000000 !important;
            border: none !important; padding: 24px; text-align: center;
            box-sizing: border-box; max-width: 90%;
          }
          .qrcode-wrapper {
            background: #ffffff !important; padding: 12px;
            border-radius: 12px; display: inline-block; margin-bottom: 16px;
          }
          .title {
            font-size: 18px; font-weight: 900; text-transform: uppercase;
            margin: 0 0 6px 0; line-height: 1.2;
          }
          .info-text {
            font-size: 10px; font-family: monospace; color: #444444;
            margin: 4px 0 0 0; text-transform: uppercase;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="print-label">
          <div class="qrcode-wrapper" id="qrcode-canvas"></div>
          <h4 class="title">${item.name}</h4>
          <p class="info-text">ID: ${item.id.slice(0, 8).toUpperCase()}</p>
          ${
            item.serialNumber
              ? `<p class="info-text">SN: ${item.serialNumber}</p>`
              : ""
          }
          ${item.sku ? `<p class="info-text">SKU/EAN: ${item.sku}</p>` : ""}
        </div>

        <script>
          new QRCode(document.getElementById("qrcode-canvas"), {
            text: "${qrCodeUrl}",
            width: 180,
            height: 180,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
          });

          window.onload = function() {
            setTimeout(() => {
              window.focus();
              window.print();
              setTimeout(() => { window.frameElement.remove(); }, 500);
            }, 550);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
}
