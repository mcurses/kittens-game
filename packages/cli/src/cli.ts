import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface SlotMeta {
  slot: string;
  status: "active" | "paused" | "archived";
  createdAt: number;
  updatedAt: number;
}

export interface HttpClient {
  get(endpoint: string): Promise<unknown>;
  post(endpoint: string, body?: unknown): Promise<unknown>;
  delete(endpoint: string): Promise<unknown>;
}

const isValidSlot = (slot: string): boolean => {
  if (!slot || slot.length === 0 || slot.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(slot);
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toISOString().split("T")[0];
};

const getStatusSymbol = (status: string): string => {
  switch (status) {
    case "active":
      return "● ";
    case "paused":
      return "⏸ ";
    case "archived":
      return "▪ ";
    default:
      return "  ";
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "active":
      return "\x1b[32m"; // green
    case "paused":
      return "\x1b[33m"; // yellow
    case "archived":
      return "\x1b[90m"; // gray
    default:
      return "\x1b[0m"; // reset
  }
};

const resetColor = "\x1b[0m";

export function createCli(client: HttpClient) {
  return {
    async sessionsList(json: boolean): Promise<string> {
      const response = (await client.get("/api/sessions")) as {
        sessions: SlotMeta[];
      };

      if (json) {
        return JSON.stringify(response.sessions);
      }

      // Table format
      const sessions = response.sessions as SlotMeta[];
      if (sessions.length === 0) {
        return "No sessions found.";
      }

      let output = "Name          | Status | Created      | Updated\n";
      output += "--------------|--------|--------------|------------\n";

      for (const session of sessions) {
        const color = getStatusColor(session.status);
        const symbol = getStatusSymbol(session.status);
        const created = formatDate(session.createdAt);
        const updated = formatDate(session.updatedAt);

        output += `${session.slot.padEnd(13)} | ${color}${symbol}${resetColor} ${session.status.padEnd(5)} | ${created} | ${updated}\n`;
      }

      return output;
    },

    async sessionsCreate(slot: string): Promise<string> {
      if (!isValidSlot(slot)) {
        throw new Error(
          `Invalid slot name: "${slot}". Use alphanumeric, dash, or underscore (1-64 chars).`,
        );
      }

      const result = (await client.post("/api/sessions", {
        slot,
      })) as SlotMeta;

      return `Session "${result.slot}" created successfully.`;
    },

    async sessionsPause(slot: string): Promise<string> {
      const result = (await client.post(`/api/sessions/${slot}/pause`)) as SlotMeta;

      return `Session "${result.slot}" paused.`;
    },

    async sessionsResume(slot: string): Promise<string> {
      const result = (await client.post(`/api/sessions/${slot}/resume`)) as SlotMeta;

      return `Session "${result.slot}" resumed.`;
    },

    async sessionsArchive(slot: string): Promise<string> {
      const result = (await client.post(`/api/sessions/${slot}/archive`)) as SlotMeta;

      return `Session "${result.slot}" archived.`;
    },

    async sessionsDelete(slot: string): Promise<string> {
      await client.delete(`/api/sessions/${slot}`);

      return `Session "${slot}" deleted.`;
    },

    async sessionsExport(slot: string, outputFile?: string): Promise<string> {
      const json = (await client.get(`/api/sessions/${slot}/export`)) as string;

      const filename = outputFile || `${slot}.json`;
      const filepath = resolve(filename);

      writeFileSync(filepath, json, "utf-8");

      const bytes = Buffer.byteLength(json, "utf-8");
      return `Session "${slot}" exported to ${filename} (${bytes} bytes).`;
    },
  };
}
