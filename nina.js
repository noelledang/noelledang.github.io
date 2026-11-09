/* Nina — AI assistant with verified, offline-curated fallback. */
(() => {
  "use strict";
  const launch = document.getElementById("nina-launch");
  const panel = document.getElementById("nina-panel");
  const close = document.getElementById("nina-close");
  const log = document.getElementById("nina-messages");
  const prompts = document.getElementById("nina-prompts");
  const form = document.getElementById("nina-form");
  const input = document.getElementById("nina-input");
  const send = form?.querySelector('button[type="submit"]');
  const mode = document.getElementById("nina-mode");
  if (!launch || !panel || !close || !log || !prompts || !form || !input || !send) return;

  const endpoint = typeof window.NINA_API_URL === "string" ? window.NINA_API_URL.trim() : "";
  let topics = [];
  let history = [];
  let busy = false;

  function bubble(message, type, link, label) {
    const entry = document.createElement("p");
    entry.className = "nina-bubble " + type;
    entry.textContent = message; // Safe plain text; never inject user/model HTML.
    if (link && label) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.textContent = label + " ↗";
      entry.appendChild(anchor);
    }
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    return entry;
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
  function fallback(question) {
    const found = matchTopic(question);
    if (found) bubble(found.answer, "bot", found.link, found.linkLabel);
    else bubble("I don't have a verified answer for that in Noelle's portfolio yet. Please explore her case studies or contact Noelle directly.", "bot", "mailto:Dang.Noelle@gmail.com", "Email Noelle");
  }

  async function ask(question) {
    if (busy) return;
    busy = true;
    send.disabled = true;
    input.disabled = true;
    bubble(question, "visitor");
    let successfulAI = false;
    const oldHistory = history.slice(-6);
    try {
      if (endpoint) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, history: oldHistory }),
            signal: controller.signal
          });
          if (!response.ok) throw new Error("AI backend unavailable");
          const data = await response.json();
          if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("No answer");
          bubble(data.answer, "bot");
          history = [...oldHistory, { role: "user", content: question }, { role: "assistant", content: data.answer.slice(0, 800) }].slice(-6);
          successfulAI = true;
          if (mode) mode.textContent = "AI Portfolio Assistant";
        } finally {
          clearTimeout(timeout);
        }
      }
    } catch {
      if (mode) mode.textContent = "Portfolio guide · Curated mode";
    } finally {
      if (!successfulAI) {
        fallback(question);
        history = []; // Do not mix curated fallback replies into later LLM history.
      }
      busy = false;
      send.disabled = false;
      input.disabled = false;
      log.scrollTop = log.scrollHeight;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = input.value.trim();
    if (!q || busy) return;
    input.value = "";
    void ask(q);
  });

  fetch("portfolio-knowledge.json")
    .then((response) => { if (!response.ok) throw new Error("Unable to load portfolio data"); return response.json(); })
    .then((data) => {
      topics = Array.isArray(data.topics) ? data.topics : [];
      if (mode) mode.textContent = endpoint ? "AI Assistant · Connected backend" : "Portfolio guide · Curated mode";
      bubble("Hi! I'm Nina. Ask about Noelle's technical support experience, tools, projects, or troubleshooting case studies.", "bot");
      ["How does Noelle troubleshoot API issues?", "What technical tools does she use?", "What has she built?"].forEach((question) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nina-question";
        button.textContent = question;
        button.addEventListener("click", () => { void ask(question); });
        prompts.appendChild(button);
      });
    })
    .catch(() => {
      bubble("The portfolio guide is temporarily unavailable. You can still contact Noelle directly.", "bot", "mailto:Dang.Noelle@gmail.com", "Email Noelle");
      input.disabled = true;
      send.disabled = true;
    });
})();