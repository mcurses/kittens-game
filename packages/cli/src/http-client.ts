import { HttpClient } from "./cli.js";

export function createHttpClient(serverUrl: string): HttpClient {
  return {
    async get(endpoint: string): Promise<unknown> {
      const url = serverUrl + endpoint;
      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        const body = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try {
          const json = JSON.parse(body);
          if (json.error) {
            errorMsg = json.error;
          }
        } catch {
          // Keep default errorMsg
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }

      return response.text();
    },

    async post(endpoint: string, body?: unknown): Promise<unknown> {
      const url = serverUrl + endpoint;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try {
          const json = JSON.parse(text);
          if (json.error) {
            errorMsg = json.error;
          }
        } catch {
          // Keep default errorMsg
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }

      return response.text();
    },

    async delete(endpoint: string): Promise<unknown> {
      const url = serverUrl + endpoint;
      const response = await fetch(url, { method: "DELETE" });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try {
          const json = JSON.parse(text);
          if (json.error) {
            errorMsg = json.error;
          }
        } catch {
          // Keep default errorMsg
        }
        throw new Error(errorMsg);
      }

      return response.text();
    },
  };
}
