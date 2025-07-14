import { Agent } from "@mastra/core/agent";
import { model } from "../../config";
import { youtubeCommentsTool, youtubeStatisticsTool, youtubeMetadataTool, youtubeTranscriptTool } from "./youtube-tool";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

// Define Agent Name
const name = "YouTube Agent";

// Define instructions for the agent
// TODO: Add link here for recommendations on how to properly define instructions for an agent.
// TODO: Remove comments (// ...) from `instructions`
const instructions = `
      You are a helpful assistant that can work with Youtube video URL and provide all informations or create something new out of the informations related to the video.

      Your primary function is to help users get information about Youtube Video. When responding:
      - If the user provides a video URL, use it to fetch comments, likes, metadata, and transcript.
      - If the user does not provide a video URL, ask them to specify one.
      - Follow the user's instructions, they may ask you only for specific things from any data you have access to.
      - Use relevant details like comments, likes, metadata, and transcript to answer user's instructions.
      - Keep responses concise but informative unless you are requested to create an article, blog post, or anything that maybe a bit lengthy.
      - Answer professionally yet in a friendly manner.
      - No preamble needed, just get to the point, if you are asked to create something, just create it.

      Use the youtubeCommentsTool to fetch comments from a YouTube video. Request Google API keys to use Youtube API v3 Data API
      Use the youtubeStatisticsTool to fetch number of likes, views, and comments from a YouTube video. Request Google API keys to use Youtube API v3 Data API
      Use the youtubeMetadataTool to fetch metadata from a YouTube video.
      Use the youtubeTranscriptTool to fetch transcript from a YouTube video. Request youtube-transcript.io API keys to fetch transcript.

      All necessary API keys should be requested to user in advance.
`;

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../mastra.db", // Or your database URL
  }),
});

export const youtubeAgent = new Agent({
	name,
	instructions,
	model,
	tools: { youtubeCommentsTool, youtubeStatisticsTool, youtubeMetadataTool, youtubeTranscriptTool },
      memory: memory
});

