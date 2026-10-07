import fs from "fs";
import path from "path";

const LOG_DIR = "anpr_logs";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function logRawXml(xml) {
  ensureLogDir();

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(LOG_DIR, `xml_${ts}.xml`);
  fs.writeFileSync(filePath, xml, "utf8");
}
