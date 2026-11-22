"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const NinaLanguage = require("./nina-language.js");

const hiringTopic = {
  id: "why-choose-noelle",
  answer: "She finds ways to prevent them. With 4+ years of B2B SaaS experience.",
  responseOpenings: {
    default: "Noelle doesn't just resolve tickets.",
    why: "Because Noelle doesn't just resolve tickets.",
    yes_no: "Yes. Noelle would be a strong hire because she doesn't just resolve tickets.",
    what: "What makes Noelle a strong hire is that she doesn't just resolve tickets."
  },
  followUps: { examplesTopicId: "capabilities-examples" }
};
const examplesTopic = { id: "capabilities-examples", answer: "Here are several examples." };
const topics = [hiringTopic, examplesTopic];

test("classifies yes/no hiring questions", () => {
  for (const question of ["Is Noelle a good hire?", "Would you hire Noelle?", "Should we hire Noelle?"]) {
    assert.equal(NinaLanguage.classifyIntent(question), "yes_no");
  }
});

test("classifies why, what, recommendation, and comparison intents", () => {
  assert.equal(NinaLanguage.classifyIntent("Why is Noelle a good hire?"), "why");
  assert.equal(NinaLanguage.classifyIntent("What makes Noelle a good hire?"), "what");
  assert.equal(NinaLanguage.classifyIntent("Would you recommend Noelle?"), "recommendation");
  assert.equal(NinaLanguage.classifyIntent("How does Noelle compare to other candidates?"), "comparison");
});

test("selects an answer opening that matches a yes/no question", () => {
  const answer = NinaLanguage.buildAnswer(hiringTopic, "Is Noelle a good hire?");
  assert.ok(answer.startsWith("Yes. Noelle would be a strong hire"));
  assert.ok(!answer.startsWith("Because"));
  assert.match(answer, /She finds ways to prevent them/);
});

test("keeps the why-question opening distinct", () => {
  const answer = NinaLanguage.buildAnswer(hiringTopic, "Why is Noelle a good hire?");
  assert.ok(answer.startsWith("Because Noelle doesn't just resolve tickets."));
});

test("recognizes a contextual example follow-up", () => {
  assert.equal(NinaLanguage.resolveFollowUp("why-choose-noelle", "Can you give me an example?", topics), examplesTopic);
  assert.equal(NinaLanguage.resolveFollowUp("why-choose-noelle", "Show me an example", topics), null);
  assert.equal(NinaLanguage.resolveFollowUp("overview", "Can you give me an example?", topics), null);
});

test("does not treat a standalone topic question as a contextual follow-up", () => {
  assert.equal(NinaLanguage.isContextualExampleFollowUp("What is an example of a difficult technical problem?"), false);
});
