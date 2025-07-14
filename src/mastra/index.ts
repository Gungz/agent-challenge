import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { youtubeAgent } from "./agents/youtube-agent/youtube-agent"; // Build your agent here

export const mastra = new Mastra({
	agents: { youtubeAgent }, // Add your agents here
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
	bundler: { externals: ["ai"] },
});
