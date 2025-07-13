import { createTool } from "@mastra/core/tools";
import { z } from "zod";


const getVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (!match) throw new Error("Invalid YouTube URL");
  return match[1];
};

const getYouTubeTranscript = async ({ url, apiKey }: { url: string, apiKey: string }) => {
  try {
    const videoId = getVideoId(url);
    const response = await fetch("https://www.youtube-transcript.io/api/transcripts", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        ids: [videoId], 
      })
    })
    const data = await response.json();
    return convertJsonToTranscript(data);
  
  } catch {
    return { transcript: [] };
  }
};

const getYouTubeComments = async ({ url, maxResults = 20, apiKey }: { url: string; maxResults?: number; apiKey: string }) => {
  const videoId = getVideoId(url);
  const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&key=${apiKey}`);
  const data = await response.json();
  
  if (data.error) throw new Error(`YouTube API error: ${data.error.message}`);
  
  const comments = data.items?.map((item: any) => ({
    author: item.snippet.topLevelComment.snippet.authorDisplayName,
    text: item.snippet.topLevelComment.snippet.textDisplay,
    likes: item.snippet.topLevelComment.snippet.likeCount,
    publishedTime: item.snippet.topLevelComment.snippet.publishedAt
  })) || [];
  
  return { comments };
};


const getYouTubeStatistics = async ({ url, apiKey }: { url: string; apiKey: string }) => {
  const videoId = getVideoId(url);
  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`);
  const data = await response.json();
  
  if (data.error) throw new Error(`YouTube API error: ${data.error.message}`);
  
  const stats = data.items?.[0]?.statistics;
  return {
    likes: parseInt(stats?.likeCount || '0'),
    views: parseInt(stats?.viewCount || '0'),
    comments: parseInt(stats?.commentCount || '0')
  };
};

const getYouTubeMetadata = async ({ url }: { url: string }) => {
  const videoId = getVideoId(url);
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  const html = await response.text();
  
  const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/);
  const descMatch = html.match(/"shortDescription":"(.*?)"/);
  const viewsMatch = html.match(/"viewCount":"(\d+)"/);
  const channelMatch = html.match(/"ownerChannelName":"(.*?)"/);
  
  return {
    title: titleMatch ? titleMatch[1] : "",
    description: descMatch ? descMatch[1].replace(/\\n/g, '\n') : "",
    views: viewsMatch ? parseInt(viewsMatch[1]) : 0,
    channel: channelMatch ? channelMatch[1] : "",
    videoId
  };
};

const convertJsonToTranscript = (jsonData: any) => {
  try {
    const tracks = jsonData[0]?.tracks || [];
    if (tracks.length === 0) return { transcript: [] };
    
    const transcript = tracks[0].transcript || [];
    return {
      transcript: transcript.map((item: any) => ({
        text: item.text
      }))
    };
  } catch {
    return { transcript: [] };
  }
};

export const youtubeTranscriptTool = createTool({
  id: "youtube-transcript-tool",
  description: "Download transcript from YouTube video",
  inputSchema: z.object({
    url: z.string().describe("YouTube video URL"),
    apiKey: z.string().describe("youtube-transcript.io API key"),
  }),
  outputSchema: z.object({
    transcript: z.array(z.object({
      text: z.string()
    })).describe("Video transcript")
  }),
  execute: async ({ context }) => {
    return await getYouTubeTranscript(context);
  },
});

export const youtubeCommentsTool = createTool({
  id: "youtube-comments-tool",
  description: "Download comments from YouTube video",
  inputSchema: z.object({
    url: z.string().describe("YouTube video URL"),
    maxResults: z.number().optional().default(20).describe("Maximum number of comments (default: 20)"),
    apiKey: z.string().describe("YouTube Data API key")
  }),
  outputSchema: z.object({
    comments: z.array(z.object({
      author: z.string(),
      text: z.string(),
      likes: z.number(),
      publishedTime: z.string()
    })).describe("Video comments")
  }),
  execute: async ({ context }) => {
    return await getYouTubeComments(context);
  },
});

export const youtubeStatisticsTool = createTool({
  id: "youtube-likes-tool",
  description: "Get number of likes from YouTube video",
  inputSchema: z.object({
    url: z.string().describe("YouTube video URL"),
    apiKey: z.string().describe("YouTube Data API key")
  }),
  outputSchema: z.object({
    likes: z.number().describe("Number of likes"),
    views: z.number().describe("Number of views"),
    comments: z.number().describe("Number of comments")
  }),
  execute: async ({ context }) => {
    return await getYouTubeStatistics(context);
  },
});

export const youtubeMetadataTool = createTool({
  id: "youtube-metadata-tool",
  description: "Get metadata and description from YouTube video",
  inputSchema: z.object({
    url: z.string().describe("YouTube video URL")
  }),
  outputSchema: z.object({
    title: z.string().describe("Video title"),
    description: z.string().describe("Video description"),
    views: z.number().describe("View count"),
    channel: z.string().describe("Channel name"),
    videoId: z.string().describe("Video ID")
  }),
  execute: async ({ context }) => {
    return await getYouTubeMetadata(context);
  },
});