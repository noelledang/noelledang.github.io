/* Nina — curated portfolio guide; upgrade to a secure AI backend later. */
(() => {
  "use strict";
  const launch = document.getElementById("nina-launch");
  const panel = document.getElementById("nina-panel");
  const close = document.getElementById("nina-close");
  const log = document.getElementById("nina-messages");
  const prompts = document.getElementById("nina-prompts");
  const form = document.getElementById("nina-form");
  const input = document.getElementById("nina-input");
  if (!launch || !panel || !close || !log || !prompts || !form || !input) return;
  let topics = [];
  function bubble(message, type, link, label) {
    const entry = document.createElement("p");
    entry.className = "nina-bubble " + type;
    entry.textContent = message; // Never interpret visitor input as HTML.
    if (link && label) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.textContent = label + " ↗";
      entry.appendChild(anchor);
    }
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }
  function toggle(open) {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
    else launch.focus();
  }
  launch.addEventListener("click", () => toggle(panel.hidden));
  close.addEventListener("click", () => toggle(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) toggle(false);
  });
  // Lightweight, local-language matching: synonyms + weighted topic similarity.
  // No AI model, data collection, third-party services, or API charges.
  const stopWords = new Set("a an the is are was were do does did can could would should i we you she her hers he his noelle tell me about of for to in on at by with and or from some show what when where why how which who that this has have had my your their they it its be been being as after before into more".split(" "));
  const aliases = {
    grasp:"learn", grasping:"learn", grasped:"learn", understand:"learn",
    understanding:"learn", absorb:"learn", absorbing:"learn", learner:"learn",
    learning:"learn", learns:"learn", learned:"learn", quick:"fast",
    quickly:"fast", rapidly:"fast", rapid:"fast",
    material:"information", materials:"information", concepts:"information",
    concept:"information", websites:"website", projects:"project",
    built:"build", building:"build", developed:"build", development:"build",
    working:"work", works:"work", teams:"team", customers:"customer",
    clients:"customer", issues:"issue", problems:"problem", cases:"case",
    prioritize:"priority", prioritizing:"priority", prioritization:"priority",
    troubleshooting:"troubleshoot", investigating:"investigate",
    investigated:"investigate", investigation:"investigate",
    collaboration:"collaborate", collaborating:"collaborate",
    motivated:"motivation", motivates:"motivation",
    adaptability:"adapt", adapting:"adapt", escalating:"escalate",
    escalation:"escalate", results:"result", achievements:"achievement",
    hire:"choose", hiring:"choose", chosen:"choose", choosing:"choose",
    best:"strong", improvements:"improve", tricky:"difficult",
    tough:"difficult", hard:"difficult", angry:"frustrated",
    upset:"frustrated", unhappy:"frustrated", solved:"solve",
    solving:"solve", encountered:"seen", encounter:"seen",
    unfamiliar:"unknown", unknown:"unknown", new:"unknown",
    respond:"response", criticism:"feedback", like:"style"
  };

  function tokenize(value) {
    return String(value).toLowerCase()
      .replace(/([a-z])'s\\b/g, "$1")
      .replace(/[^a-z0-9]+/g, " ")
      .trim().split(/\\s+/).filter(Boolean)
      .map(word => aliases[word] || word)
      .filter(word => !stopWords.has(word));
  }

  let index = [];
  let documentFrequency = new Map();
  function indexTopics() {
    index = topics.map(topic => ({
      topic,
      phrases: [topic.title, ...topic.keywords].map(tokenize).filter(tokens => tokens.length > 0)
    }));
    documentFrequency = new Map();
    for (const item of index) {
      const distinct = new Set(item.phrases.flat());
      for (const token of distinct) {
        documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
      }
    }
  }
  function tokenWeight(token) {
    return 1 + Math.log(1 + topics.length / (documentFrequency.get(token) || 1));
  }
  function matchTopic(question) {
    const queryTokens = tokenize(question);
    if (!queryTokens.length) return null;
    const querySet = new Set(queryTokens);
    const totalQueryWeight = [...querySet].reduce((sum, t) => sum + tokenWeight(t), 0);
    const scores = index.map(({topic, phrases}) => {
      let best = 0;
      for (const phrase of phrases) {
        const termSet = new Set(phrase);
        const matches = [...termSet].filter(t => querySet.has(t));
        if (!matches.length) continue;
        const matchedWeight = matches.reduce((sum, t) => sum + tokenWeight(t), 0);
        const totalPhraseWeight = [...termSet].reduce((sum, t) => sum + tokenWeight(t), 0);
        const precision = matchedWeight / totalPhraseWeight;
        const coverage = matchedWeight / totalQueryWeight;
        let score = 7 * precision * coverage + 2 * matches.length;
        if (matches.length === termSet.size && termSet.size >= 2) score += 5 + termSet.size;
        if (termSet.size === 1) score += Math.min(2, tokenWeight(matches[0]) / 2);
        best = Math.max(best, score);
      }
      return { topic, score: best };
    }).sort((a, b) => b.score - a.score);
    const first = scores[0], runnerUp = scores[1];
    // Reject unsupported or ambiguous input rather than picking an unrelated answer.
    if (!first || first.score < 3 || (first.score < 5 && runnerUp && first.score - runnerUp.score < 0.5)) return null;
    return first.topic;
  }
  function ask(question) {
    bubble(question, "visitor");
    const found = matchTopic(question);
    if (found) bubble(found.answer, "bot", found.link, found.linkLabel);
    else bubble("I don't have a verified answer for that in Noelle's portfolio yet. Please explore the case studies or reach out to Noelle directly.", "bot", "mailto:Dang.Noelle@gmail.com", "Email Noelle");
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    ask(q);
  });
  fetch("portfolio-knowledge.json")
    .then((response) => { if (!response.ok) throw new Error("Unable to load portfolio data"); return response.json(); })
    .then((data) => {
      topics = Array.isArray(data.topics) ? data.topics : [];
      indexTopics();
      bubble("Hi! I'm Nina, Noelle's portfolio guide. Ask about her technical support experience, tools, projects, or troubleshooting case studies.", "bot");
      ["Why should we hire Noelle?","How does Noelle approach unfamiliar technical issues?","Show me some of Noelle's projects.","What could Noelle contribute in her first 90 days?"].forEach((question) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nina-question";
        button.textContent = question;
        button.addEventListener("click", () => ask(question));
        prompts.appendChild(button);
      });
    })
    .catch(() => {
      bubble("The portfolio guide is temporarily unavailable. You can still contact Noelle directly.", "bot", "mailto:Dang.Noelle@gmail.com", "Email Noelle");
      input.disabled = true;
      form.querySelector("button").disabled = true;
    });
})();