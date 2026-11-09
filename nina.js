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
  function normalize(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  }
  function matchTopic(question) {
    const q = normalize(question);
    const words = new Set(q.split(" ").filter(Boolean));
    const scores = topics.map((topic) => {
      let score = 0;
      for (const keyword of topic.keywords) {
        const term = normalize(keyword);
        if (term.includes(" ") ? q.includes(term) : words.has(term)) score += term.includes(" ") ? 4 : 2;
      }
      if (normalize(topic.title) === q) score += 20;
      return { topic, score };
    });
    scores.sort((a,b)=>b.score-a.score);
    return scores[0] && scores[0].score >= 2 ? scores[0].topic : null;
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
      bubble("Hi! I'm Nina, Noelle's portfolio guide. Ask about her technical support experience, tools, projects, or troubleshooting case studies.", "bot");
      ["Why should we hire Noelle?","How does Noelle approach unfamiliar technical issues?","Is Noelle a fast learner?","What could Noelle contribute in her first 90 days?"].forEach((question) => {
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