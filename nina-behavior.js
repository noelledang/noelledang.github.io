/* Nina behavioral intelligence: recognize recruiter evaluation intent using curated rules. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NinaBehavior = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function normalize(value) {
    return String(value || "").toLowerCase()
      .replace(/([a-z])'s\\b/g, "$1")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\\s+/g, " ");
  }

  // Each rule describes the quality a recruiter is evaluating and the
  // existing curated portfolio answer that contains the strongest evidence.
  const rules = [
    {
      behaviorId: "job-performance",
      topicId: "job-performance",
      priority: 12,
      patterns: [
        /\\b(?:good at (?:her|their) job|good at what she does|does she do a good job|does noelle do a good job|perform(?:s|ing)? well|effective at (?:her|the) job|job performance|work performance)\\b/
      ]
    },
    {
      behaviorId: "independent-work",
      topicId: "work-style",
      priority: 11,
      patterns: [
        /\\b(?:work|works|working|handle|handles|solve|solves|troubleshoot|troubleshoots)? ?(?:independently|on her own|without (?:help|supervision|hand holding)|self sufficient|autonomously)\\b/,
        /\\bcan she work alone\\b/,
        /\\bdoes she need (?:a lot of )?supervision\\b/
      ]
    },
    {
      behaviorId: "communication",
      topicId: "cross-functional",
      priority: 10,
      patterns: [
        /\\b(?:technical jargon|nontechnical|non technical|plain language|easy to understand|explain technical|translate technical)\\b/,
        /\\b(?:communicat\\w*|explain\\w*|translate\\w*)\\b/
      ]
    },
    {
      behaviorId: "collaboration",
      topicId: "team-player",
      priority: 10,
      patterns: [
        /\\b(?:team player|teamwork|collaborat\\w*|work well with others|works well with others|partner\\w* with|cross functional|good with people|people skills)\\b/
      ]
    },
    {
      behaviorId: "customer-empathy",
      topicId: "frustrated-customers",
      priority: 11,
      patterns: [
        /\\b(?:empath\\w*|frustrated customers|angry customers|difficult customers|customer complaints|customer advocacy|customer focused|customer empathy)\\b/
      ]
    },
    {
      behaviorId: "initiative",
      topicId: "initiative",
      priority: 11,
      patterns: [
        /\\b(?:take initiative|takes initiative|show initiative|demonstrate initiative|proactive|proactively|ownership|take ownership|takes ownership|go above and beyond|self starter)\\b/
      ]
    },
    {
      behaviorId: "adaptability",
      topicId: "fast-learner",
      priority: 10,
      patterns: [
        /\\b(?:adapt\\w*|fast learner|quick learner|learn\\w* quickly|pick up new (?:skills|tools|technology|concepts)|ramp up|learning agility)\\b/
      ]
    },
    {
      behaviorId: "prioritization",
      topicId: "case-prioritization",
      priority: 10,
      patterns: [
        /\\b(?:prioriti\\w*|triage|competing (?:priorities|cases)|manage multiple (?:tasks|tickets|priorities)|decide what to work on first)\\b/
      ]
    },
    {
      behaviorId: "problem-solving",
      topicId: "difficult-case",
      priority: 9,
      patterns: [
        /\\b(?:problem solv\\w*|troubleshoot\\w*|root cause|difficult (?:technical )?(?:problem|issue|situation)|complex (?:technical )?(?:problem|issue)|under pressure|think on her feet|figure out unfamiliar)\\b/
      ]
    },
    {
      behaviorId: "process-improvement",
      topicId: "documentation",
      priority: 9,
      patterns: [
        /\\b(?:process improvement|improve (?:a |the )?(?:process|workflow)|workflow improvement|reduce repeat|self service|knowledge base|make processes better)\\b/
      ]
    },
    {
      behaviorId: "leadership",
      topicId: "leadership-demonstration",
      priority: 9,
      patterns: [
        /\\b(?:leadership|lead a team|mentor\\w*|train\\w* (?:new hires|teammates)|empower\\w* (?:the )?team|help others grow)\\b/
      ]
    }
  ];

  function analyze(question) {
    const value = normalize(question);
    if (!value) return null;

    const matches = [];
    for (const rule of rules) {
      let bestLength = 0;
      for (const pattern of rule.patterns) {
        const match = value.match(pattern);
        if (match && match[0].length > bestLength) bestLength = match[0].length;
      }
      if (bestLength) {
        matches.push({
          behaviorId: rule.behaviorId,
          topicId: rule.topicId,
          score: bestLength + rule.priority
        });
      }
    }
    if (!matches.length) return null;
    matches.sort((a, b) => b.score - a.score);
    // If the wording clearly evaluates multiple different behaviors, let the
    // existing clarification/rephrase flow handle it instead of guessing.
    if (matches[1] && matches[0].score === matches[1].score) return null;
    return {
      behaviorId: matches[0].behaviorId,
      topicId: matches[0].topicId,
      confidence: matches[0].score
    };
  }

  return { normalize, analyze };
});
