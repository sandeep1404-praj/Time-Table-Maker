import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, "..", "assets", "guruaaklanLogo.png");
const logoBase64 = fs.readFileSync(logoPath, "base64");
const logoDataUri = `data:image/png;base64,${logoBase64}`;

export { logoDataUri };
