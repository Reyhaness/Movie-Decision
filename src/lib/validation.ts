import { z } from "zod";
import { TIME_SELECTIONS, MOOD_SELECTIONS, SITUATION_SELECTIONS } from "@/services/recommendation/types";

export const recommendationInputSchema = z.object({
  time: z.enum(TIME_SELECTIONS),
  mood: z.enum(MOOD_SELECTIONS),
  situation: z.enum(SITUATION_SELECTIONS),
  sessionId: z.string().min(1).optional(),
});

export type RecommendationInput = z.infer<typeof recommendationInputSchema>;
