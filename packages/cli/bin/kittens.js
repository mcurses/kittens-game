#!/usr/bin/env bun
import { Command } from "commander";
import { createCli, createHttpClient } from "../src/index.js";
const program = new Command();
program
    .name("kittens")
    .description("Kittens Game session manager CLI")
    .version("0.1.0")
    .option("--server <url>", "Server URL", "http://localhost:3000");
const sessionsCmd = program
    .command("sessions")
    .description("Manage game sessions");
sessionsCmd
    .command("list")
    .description("List all sessions")
    .option("--json", "Output as JSON")
    .action(async (options) => {
    try {
        const serverUrl = program.opts().server;
        const client = createHttpClient(serverUrl);
        const cli = createCli(client);
        const output = await cli.sessionsList(options.json ?? false);
        console.log(output);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
sessionsCmd
    .command("create <slot>")
    .description("Create a new session")
    .action(async (slot) => {
    try {
        const serverUrl = program.opts().server;
        const client = createHttpClient(serverUrl);
        const cli = createCli(client);
        const output = await cli.sessionsCreate(slot);
        console.log(output);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
sessionsCmd
    .command("pause <slot>")
    .description("Pause a session")
    .action(async (slot) => {
    try {
        const serverUrl = program.opts().server;
        const client = createHttpClient(serverUrl);
        const cli = createCli(client);
        const output = await cli.sessionsPause(slot);
        console.log(output);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
sessionsCmd
    .command("resume <slot>")
    .description("Resume a paused session")
    .action(async (slot) => {
    try {
        const serverUrl = program.opts().server;
        const client = createHttpClient(serverUrl);
        const cli = createCli(client);
        const output = await cli.sessionsResume(slot);
        console.log(output);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
sessionsCmd
    .command("archive <slot>")
    .description("Archive a session")
    .option("--confirm", "Confirm archival (required)")
    .action(async (slot, options) => {
    try {
        if (!options.confirm) {
            console.error(`Error: Archival requires --confirm flag. Use: kittens sessions archive ${slot} --confirm`);
            process.exit(1);
        }
        const serverUrl = program.opts().server;
        const client = createHttpClient(serverUrl);
        const cli = createCli(client);
        const output = await cli.sessionsArchive(slot);
        console.log(output);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
sessionsCmd
    .command("delete <slot>")
    .description("Delete a session")
    .option("--confirm", "Confirm deletion (required)")
    .action(async (slot, options) => {
    try {
        if (!options.confirm) {
            console.error(`Error: Deletion requires --confirm flag. Use: kittens sessions delete ${slot} --confirm`);
            process.exit(1);
        }
        const serverUrl = program.opts().server;
        const client = createHttpClient(serverUrl);
        const cli = createCli(client);
        const output = await cli.sessionsDelete(slot);
        console.log(output);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
sessionsCmd
    .command("export <slot>")
    .description("Export a session's game state")
    .option("--output <file>", "Output file (default: <slot>.json)")
    .action(async (slot, options) => {
    try {
        const serverUrl = program.opts().server;
        const client = createHttpClient(serverUrl);
        const cli = createCli(client);
        const output = await cli.sessionsExport(slot, options.output);
        console.log(output);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=kittens.js.map