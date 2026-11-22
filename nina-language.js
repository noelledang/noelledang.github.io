/* Nina language helpers: deterministic intent recognition and contextual follow-ups. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NinaLanguage = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function normalize(value) {
    return String(value || "").toLowerCase()
      .replace(/([a-z])'s\b/g, "$1")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function classifyIntent(question) {
    const value = normalize(question);
    if (/\b(compare|compared|comparison|versus|vs|other candidates|other applicants)\b/.test(value)) return "comparison";
    if (/\b(recommend|recommendation)\b/.test(value)) return "recommendation";
    if (/\b(example|examples|for instance)\b/.test(value)) return "example";
    if (/^(is|are|does|do|can|could|would|should|has|have|will)\b/.test(value)) return "yes_no";
    if (/^why\b/.test(value)) return "why";
    if (/^what\b/.test(value)) return "what";
    if (/^how\b/.test(value)) return "how";
    return "general";
  }

  function isContextualExampleFollowUp(question) {
    const value = normalize(question);
    return /^(can you |could you |would you |please )?(give|show|share|provide)( me)?( a| an| some)? examples?( please)?$/.test(value)
      || /^(can you |could you |please )?(give|show|share|provide)( me)?( a| an| some)? examples? of that$/.test(value)
      || /^(tell me more|more details|can you elaborate|could you elaborate|can you explain that|how so|what about that)$/.test(value);
  }

  function buildAnswer(topic, question) {
    if (!topic) return "";
    const variants = topic.responseOpenings;
    if (!variants) return topic.answer || "";
    const intent = classifyIntent(question);
    const opening = variants[intent] || variants.default;
    if (!opening) return topic.answer || "";
    return [opening, topic.answer || ""].filter(Boolean).join(" ");
  }

  function resolveFollowUp(previousTopicId, question, topics) {
    if (!previousTopicId || !isContextualExampleFollowUp(question)) return null;
    const previous = (topics || []).find(topic => topic.id === previousTopicId);
    const targetId = previous && previous.followUps && previous.followUps.examplesTopicId;
    return targetId ? (topics || []).find(topic => topic.id === targetId) || null : null;
  }

  return { normalize, classifyIntent, isContextualExampleFollowUp, buildAnswer, resolveFollowUp };
});
