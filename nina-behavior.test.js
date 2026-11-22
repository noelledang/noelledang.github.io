const test = require("node:test");
const assert = require("node:assert/strict");
const NinaBehavior = require("./nina-behavior.js");

const cases = [
  ["Would you say she's good at her job?", "job-performance"],
  ["Can she work independently?", "independent-work"],
  ["Does she take ownership without being asked?", "initiative"],
  ["Can she explain technical jargon in simple language?", "communication"],
  ["Does she work well with other teams?", "collaboration"],
  ["How does she handle frustrated customers?", "customer-empathy"],
  ["Is she adaptable when priorities change?", "adaptability"],
  ["How does she prioritize competing tickets?", "prioritization"],
  ["How does she solve difficult technical problems?", "problem-solving"],
  ["Does she look for ways to improve processes?", "process-improvement"],
  ["Does she demonstrate leadership by helping teammates?", "leadership"]
];

for (const [question, expected] of cases) {
  test(question, () => {
    assert.equal(NinaBehavior.analyze(question)?.behaviorId, expected);
  });
}

test("routes technical communication to its dedicated evidence topic", () => {
  assert.equal(NinaBehavior.analyze("Can she explain technical jargon in simple language?")?.topicId, "communication");
});

test("does not misroute a career-gap explanation as communication", () => {
  assert.equal(NinaBehavior.analyze("How does she explain her career gap?"), null);
});

test("does not force a behavior match for an unrelated question", () => {
  assert.equal(NinaBehavior.analyze("What is her favorite movie?"), null);
});

test("normalizes contractions and punctuation", () => {
  assert.equal(
    NinaBehavior.analyze("Would you say she's good at her job?!")?.topicId,
    "job-performance"
  );
});
