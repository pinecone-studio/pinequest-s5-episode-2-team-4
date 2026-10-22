// Data access layer. Pages and components read data only through these
// functions, never by importing src/lib/mock directly, so a real API can
// replace the mock later without touching the UI.
//
// The functions are async like a real API. Call them in Server Components
// (pages, layouts) and pass the result to Client Components as props.

import { petStage } from "./pets";
import type { Lesson, PetLine, Subtopic, SubtopicProgress, Topic } from "./types";
import {
  helperConversation,
  helperFallbackReply,
  helperReplies,
  helperSuggestions,
  lessons,
} from "./mock/lessons";
import { testQuestions, testResult } from "./mock/questions";
import {
  assignmentDraft,
  classOverview,
  heatmap,
  notifications,
} from "./mock/teacher";
import { petLines } from "./mock/pets";
import { progress, subtopics, topics } from "./mock/topics";
import { currentUser } from "./mock/users";

// Student

export async function getCurrentUser() {
  return currentUser;
}

// Pets

export async function getPetLines(): Promise<PetLine[]> {
  return petLines;
}

export async function getPetLine(id: string): Promise<PetLine | undefined> {
  return petLines.find((l) => l.id === id);
}

/** The current user's pet with its line and the stage for its level. */
export async function getCurrentPet() {
  const pet = currentUser.pet;
  const line = pet && petLines.find((l) => l.id === pet.lineId);
  if (!pet || !line) return undefined;
  return { ...pet, line, stage: petStage(line, pet.level) };
}

// Topics and progress

export async function getTopics(): Promise<Topic[]> {
  return topics;
}

export async function getTopic(topicId: string): Promise<Topic | undefined> {
  return topics.find((t) => t.id === topicId);
}

export async function getSubtopics(topicId: string): Promise<Subtopic[]> {
  return subtopics
    .filter((s) => s.topicId === topicId)
    .sort((a, b) => a.order - b.order);
}

export async function getSubtopic(id: string): Promise<Subtopic | undefined> {
  return subtopics.find((s) => s.id === id);
}

export async function getProgress(): Promise<SubtopicProgress[]> {
  return progress;
}

export async function getTestQuestions(topicId: string) {
  return testQuestions.filter((q) =>
    topics.find((t) => t.id === topicId)?.subtopicIds.includes(q.subtopicId),
  );
}

export async function getTestResult() {
  return testResult;
}

export async function getLesson(subtopicId: string): Promise<Lesson | undefined> {
  return lessons.find((l) => l.subtopicId === subtopicId);
}

// AI helper (canned replies until a real AI API is connected)

export async function getHelperConversation() {
  return { messages: helperConversation, suggestions: helperSuggestions };
}

export async function askHelper(question: string): Promise<string> {
  return helperReplies[question] ?? helperFallbackReply;
}

// Teacher

export async function getClassOverview() {
  return classOverview;
}

export async function getHeatmap() {
  return heatmap;
}

export async function getAssignmentDraft() {
  return assignmentDraft;
}

export async function getNotifications() {
  return notifications;
}
