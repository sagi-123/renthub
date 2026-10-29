import { z } from "zod";

// Example async function (replaces createServerFn for SPA builds).
// Usage:  const result = await getGreeting({ name: "Ada" })
export async function getGreeting(data: { name: string }) {
  z.object({ name: z.string().min(1) }).parse(data);
  return {
    greeting: `Hello, ${data.name}!`,
    mode: import.meta.env.MODE ?? "unknown",
  };
}
