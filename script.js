const diceEl = document.getElementById("dice");
const bigBtn = document.getElementById("big");
const smallBtn = document.getElementById("small");
const startBtn = document.getElementById("start");
const againBtn = document.getElementById("rollAgain");
const viewBtn = document.getElementById("viewDemo");
const downloadBtn = document.getElementById("downloadHistory");
const resultEl = document.getElementById("result");
const valueEl = document.getElementById("value");
const historyList = document.getElementById("historyList");

let playerChoice = "";
let userIP = "未知";
let history = [];

fetch("https://api.ipify.org?format=json")
  .then(res => res.json())
  .then(data => userIP = data.ip)
  .catch(() => userIP = "获取失败");

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function updateDiceVisual(value) {
  const symbols = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  diceEl.textContent = symbols[value];
  valueEl.textContent = value;
}

function uploadHistoryToSheet(record) {
  const formData = new FormData();
  formData.append("data", JSON.stringify(record));

  fetch("https://script.google.com/macros/s/AKfycbxQcf1kPGrWWF9k41nZ9gOzsifE5WOQprk_zysas_JiJQLqTAbH4jEho2G415jMlo_-/exec", {
    method: "POST",
    mode: "no-cors",
    body: formData
  });

  console.log("✅ 数据已发送（无法确认响应）");
}

function addHistory(dice, interactionType, bet, resultOutcome) {
  const timestamp = new Date().toLocaleString();
  const record = {
    Time: timestamp,
    IP: userIP,
    Choice: interactionType,
    bet: bet || "",
    Dice: dice,
    result: resultOutcome
  };
  history.push(record);

  const li = document.createElement("li");
  li.textContent = `${record.Time} | IP: ${record.IP} | ${record.Choice} | ${record.Bet} | 🎲 ${record.Dice} ➜ ${record.Result}`;
  historyList.prepend(li);

  uploadHistoryToSheet(record);
}

function playRound() {
  if (!playerChoice) {
    alert("请先选择“大”或“小”！");
    return;
  }

  resultEl.textContent = "摇骰子中...";
  resultEl.style.color = "black";

  let counter = 0;
  const animation = setInterval(() => {
    updateDiceVisual(rollDice());
    counter++;
    if (counter >= 10) {
      clearInterval(animation);
      const value = rollDice();
      updateDiceVisual(value);
      const isBig = value >= 4;
      const isSmall = value <= 3;
      let outcome = "";
      if ((isBig && playerChoice === "big") || (isSmall && playerChoice === "small")) {
        outcome = "赢";
        resultEl.style.color = "green";
      } else {
        outcome = "输";
        resultEl.style.color = "red";
      }
      resultEl.textContent = outcome;
      addHistory(value, "多摇一次", playerChoice === "big" ? "大" : "小", outcome);
    }
  }, 80);
}

bigBtn.addEventListener("click", () => {
  playerChoice = "big";
  bigBtn.classList.add("selected");
  smallBtn.classList.remove("selected");
});
smallBtn.addEventListener("click", () => {
  playerChoice = "small";
  smallBtn.classList.add("selected");
  bigBtn.classList.remove("selected");
});
startBtn.addEventListener("click", playRound);
againBtn.addEventListener("click", playRound);

viewBtn.addEventListener("click", () => {
  const values = [];
  for (let i = 0; i < 10; i++) values.push(rollDice());
  const val = values[Math.floor(Math.random() * 10)];
  alert("🎲 模拟 10 次点数结果：\n" + values.join(", "));
  addHistory(val, "浏览历史记录", "", "");
});

downloadBtn.addEventListener("click", () => {
  if (history.length === 0) {
    alert("当前没有历史记录可以下载！");
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(history);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "历史记录");
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dice-history.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
