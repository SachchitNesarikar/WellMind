const questions = {
      Q1: {
        text: "I often feel motivated and excited about my daily tasks.",
        options: { agree: "Q2", neutral: "Q3", disagree: "Q4" }
      },
      Q2: {
        text: "I find it easy to stay focused and complete what I start.",
        options: { agree: "Q5", neutral: "Q6", disagree: "Q7" }
      },
      Q3: {
        text: "There are days when I feel fine, but some days I lack energy for no clear reason.",
        options: { agree: "Q6", neutral: "Q5", disagree: "Q7" }
      },
      Q4: {
        text: "I often feel tired or find it hard to get out of bed even after enough sleep.",
        options: { agree: "Q8", neutral: "Q6", disagree: "Q5" }
      },
      Q5: {
        text: "I feel satisfied with my social relationships.",
        options: { agree: "Q9", neutral: "Q6", disagree: "Q8" }
      },
      Q6: {
        text: "I sometimes can't explain why I feel anxious or sad.",
        options: { agree: "Q7", neutral: "Q5", disagree: "Q9" }
      },
      Q7: {
        text: "I find it hard to stay focused even on things I enjoy.",
        options: { agree: "Q8", neutral: "Q9", disagree: "Q5" }
      },
      Q8: {
        text: "I feel emotionally numb or disconnected most of the time.",
        options: { agree: "Q9", neutral: "Q10", disagree: "Q5" }
      },
      Q9: {
        text: "I feel confident in handling challenges that come my way.",
        options: { agree: "Q10", neutral: "Q6", disagree: "Q8" }
      },
      Q10: {
        text: "I often find it difficult to see positive things in my life right now.",
        options: { agree: "END", neutral: "END", disagree: "END" }
      }
    };

    let current = "Q1";
    let score = 0;
    let history = [];
    let questionCount = 1;
    const maxQuestions = 10;

    function renderQuestion() {
      const q = questions[current];
      document.getElementById("result").textContent = "";
      document.getElementById("question").textContent = q.text;
      document.getElementById("progress").textContent = `Question ${questionCount} of ${maxQuestions}`;
      document.getElementById("score").textContent = "Score: " + score;
      const optionsDiv = document.getElementById("options");
      optionsDiv.innerHTML = "";

      ["agree", "neutral", "disagree"].forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        btn.onclick = () => handleAnswer(opt);
        optionsDiv.appendChild(btn);
      });

      document.getElementById("prevBtn").style.display = history.length > 0 ? "block" : "none";
    }

    function handleAnswer(answer) {
      const prevScore = score;
      if (answer === "agree") score += 1;
      else if (answer === "disagree") score -= 1;

      history.push({ q: current, answer: answer, scoreBefore: prevScore });

      const next = questions[current].options[answer];
      if (next === "END" || questionCount >= maxQuestions) {
        showResult();
        return;
      }

      current = next;
      questionCount++;
      renderQuestion();
    }

    function goBack() {
      if (history.length === 0) return;

      const last = history.pop();
      score = last.scoreBefore;
      current = last.q;
      questionCount = Math.max(1, questionCount - 1);
      renderQuestion();
    }

    function showResult() {
      document.getElementById("question").textContent = "🧾 Your Mental Health Scorecard";
      document.getElementById("options").innerHTML = "";
      document.getElementById("prevBtn").style.display = "none";
      document.getElementById("progress").textContent = "";
      document.getElementById("score").textContent = "Final Score: " + score;

      let message = "";
      let suggestions = [];

      if (score >= 6) {
        message = "✅ You seem to have a balanced and positive mental state.";
        suggestions = [
          "Gratitude Journaling Challenge",
          "Mindfulness Meditation Practice",
          "Community Engagement Test"
        ];
      } else if (score >= 2) {
        message = "⚖️ You may experience emotional ups and downs.";
        suggestions = [
          "Stress Management Assessment",
          "Sleep Quality Tracker Test",
          "Emotional Resilience Test"
        ];
      } else {
        message = "💭 You might be feeling mentally exhausted or under stress.";
        suggestions = [
          "Depression Self-Check",
          "Anxiety Level Assessment",
          "Burnout Evaluation Test"
        ];
      }

      document.getElementById("result").innerHTML = `
        ${message}
        <br><br>
        <strong>Recommended Next Steps:</strong>
        <ul>${suggestions.map(s => `<li>${s}</li>`).join("")}</ul>
      `;
    }

    renderQuestion();