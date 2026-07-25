import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "sheets-config.json");

export interface SheetsConfig {
  spreadsheetId: string;
  serviceAccountJson: string;
  enabled: boolean;
  configuredAt: string;
}

export function readConfig(): SheetsConfig | null {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as SheetsConfig;
  } catch {
    return null;
  }
}

export function writeConfig(config: SheetsConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function clearConfig(): void {
  try {
    fs.unlinkSync(CONFIG_PATH);
  } catch {
    // ignore
  }
}
