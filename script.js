const STORAGE_KEY = "expenseTrackerTransactions";

const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");
const transactionList = document.getElementById("transaction-list");
const emptyState = document.getElementById("empty-state");
const clearAllButton = document.getElementById("clear-all");

let transactions = loadTransactions();

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Font Awesome 6 solid icon names per category (shown in row; category name is not displayed as text). */
const CATEGORY_ICON_CLASSES = {
  Salary: "fa-sack-dollar",
  Freelance: "fa-laptop-code",
  Business: "fa-briefcase",
  "Food & Dining": "fa-utensils",
  Transportation: "fa-car",
  Housing: "fa-house",
  Utilities: "fa-bolt",
  Shopping: "fa-bag-shopping",
  Healthcare: "fa-heart-pulse",
  Entertainment: "fa-film",
  Education: "fa-graduation-cap",
  Travel: "fa-plane",
  Insurance: "fa-shield-halved",
  Investments: "fa-chart-line",
  Other: "fa-layer-group",
};

function getCategoryIconClass(category) {
  return CATEGORY_ICON_CLASSES[category] || CATEGORY_ICON_CLASSES.Other;
}

function formatLedgerLine(transaction) {
  const label = transaction.type === "income" ? "CREDIT" : "DEBIT";
  const dateLabel = new Date(transaction.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${label} · ${dateLabel.toUpperCase()}`;
}

function calculateTotals() {
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.income += transaction.amount;
      } else {
        acc.expenses += transaction.amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  totals.balance = totals.income - totals.expenses;
  return totals;
}

function renderSummary() {
  const totals = calculateTotals();
  balanceEl.textContent = formatCurrency(totals.balance);
  incomeEl.textContent = formatCurrency(totals.income);
  expensesEl.textContent = formatCurrency(totals.expenses);
}

function createTransactionCard(transaction) {
  const item = document.createElement("li");
  item.className = `transaction-card transaction-card--${transaction.type}`;
  item.dataset.id = transaction.id;

  const amountSign = transaction.type === "income" ? "+" : "-";
  const category = transaction.category || "Other";
  const iconClass = getCategoryIconClass(category);
  const titleSafe = escapeHtml(transaction.description);
  const metaLine = formatLedgerLine(transaction);

  item.innerHTML = `
    <div class="transaction-card__main">
      <div class="transaction-card__icon" title="${escapeHtml(category)}">
        <span class="visually-hidden">${escapeHtml(category)}</span>
        <i class="fa-solid ${iconClass}" aria-hidden="true"></i>
      </div>
      <div class="transaction-card__text">
        <p class="transaction-card__title">${titleSafe}</p>
        <p class="transaction-card__meta">${metaLine}</p>
      </div>
    </div>
    <div class="transaction-card__actions">
      <span class="transaction-card__amount transaction-card__amount--${transaction.type}">
        ${amountSign}${formatCurrency(transaction.amount)}
      </span>
      <button
        class="btn btn--delete btn--icon-only"
        type="button"
        data-action="delete"
        aria-label="Delete transaction"
      >
        <span class="visually-hidden">Delete transaction</span>
        <svg class="btn__icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M6 7H5v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7h-1v13H6V7zm12-2V4h-4l-1-1h-4L8 4H4v1h14zM9 9h2v9H9V9zm4 0h2v9h-2V9z"
          />
        </svg>
      </button>
    </div>
  `;

  return item;
}

function renderTransactions() {
  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    emptyState.hidden = false;
    clearAllButton.hidden = true;
    return;
  }

  emptyState.hidden = true;
  clearAllButton.hidden = false;

  const ordered = [...transactions].sort((a, b) => b.createdAt - a.createdAt);
  ordered.forEach((transaction) => {
    transactionList.appendChild(createTransactionCard(transaction));
  });
}

function renderAll() {
  renderSummary();
  renderTransactions();
}

function addTransaction(event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number.parseFloat(amountInput.value);
  const category = categoryInput.value;
  const submitter = event.submitter;
  const type =
    submitter instanceof HTMLButtonElement && submitter.dataset.type === "expense"
      ? "expense"
      : "income";

  if (!description || Number.isNaN(amount) || amount <= 0) {
    return;
  }

  const transaction = {
    id: crypto.randomUUID(),
    description,
    amount,
    type,
    category,
    createdAt: Date.now(),
  };

  transactions.push(transaction);
  saveTransactions();
  renderAll();
  form.reset();
  categoryInput.value = "Salary";
  descriptionInput.focus();
}

function deleteTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);
  saveTransactions();
  renderAll();
}

function onTransactionListClick(event) {
  const deleteBtn = event.target instanceof Element ? event.target.closest("[data-action='delete']") : null;
  if (!deleteBtn) {
    return;
  }

  const card = deleteBtn.closest(".transaction-card");
  if (!card || !card.dataset.id) {
    return;
  }

  deleteTransaction(card.dataset.id);
}

function clearAllTransactions() {
  transactions = [];
  saveTransactions();
  renderAll();
}

form.addEventListener("submit", addTransaction);
transactionList.addEventListener("click", onTransactionListClick);
clearAllButton.addEventListener("click", clearAllTransactions);

renderAll();
