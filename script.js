const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const rates = {
  medical: 245,
  emergency: 380,
  surgical: 520,
  maternal: 320,
  mental: 290,
};

const multipliers = {
  standard: 1,
  hardship: 1.18,
  critical: 1.35,
};

const role = document.querySelector("#role");
const zone = document.querySelector("#zone");
const days = document.querySelector("#days");
const travel = document.querySelector("#travel");
const daysOutput = document.querySelector("#days-output");
const coverageCost = document.querySelector("#coverage-cost");
const handoverCost = document.querySelector("#handover-cost");
const travelCost = document.querySelector("#travel-cost");
const reserveCost = document.querySelector("#reserve-cost");
const totalCost = document.querySelector("#total-cost");
const form = document.querySelector("#apply");
const formStatus = document.querySelector("#form-status");
const honeypot = document.querySelector("#website");
const consent = document.querySelector("#consent");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");
const filterButtons = document.querySelectorAll("[data-region-filter]");
const regionCards = document.querySelectorAll(".region-card");

function calculateLeaveCost() {
  if (!role || !zone || !days || !travel) {
    return 0;
  }

  const requestedDays = Number(days.value);
  const dailyRate = rates[role.value] * multipliers[zone.value];
  const coverage = dailyRate * requestedDays;
  const handover = role.value === "surgical" ? 900 : 650;
  const travelCoordination = travel.checked ? 480 : 0;
  const reserve = (coverage + handover + travelCoordination) * 0.08;
  const total = coverage + handover + travelCoordination + reserve;

  daysOutput.textContent = `${requestedDays} days`;
  coverageCost.textContent = money.format(coverage);
  handoverCost.textContent = money.format(handover);
  travelCost.textContent = money.format(travelCoordination);
  reserveCost.textContent = money.format(reserve);
  totalCost.textContent = money.format(total);

  return total;
}

function closeMenu() {
  siteNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("title", "Open menu");
  const icon = navToggle.querySelector("svg");
  if (icon) {
    icon.outerHTML = '<i data-lucide="menu"></i>';
    window.lucide?.createIcons();
  }
}

if (role && zone && days && travel) {
  [role, zone, days, travel].forEach((control) => {
    control.addEventListener("input", calculateLeaveCost);
    control.addEventListener("change", calculateLeaveCost);
  });
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("title", isOpen ? "Close menu" : "Open menu");
    navToggle.innerHTML = `<i data-lucide="${isOpen ? "x" : "menu"}"></i>`;
    window.lucide?.createIcons();
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMenu();
    }
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.regionFilter;

    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    regionCards.forEach((card) => {
      const tags = card.dataset.region.split(" ");
      card.classList.toggle("is-hidden", filter !== "all" && !tags.includes(filter));
    });
  });
});

if (form) {
  const textFields = form.querySelectorAll('input[required][type="text"], input[required][type="email"]');

  textFields.forEach((field) => {
    field.addEventListener("input", () => {
      field.setCustomValidity(field.value.trim() ? "" : "Please enter a real value.");
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    textFields.forEach((field) => {
      field.setCustomValidity(field.value.trim() ? "" : "Please enter a real value.");
    });

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (honeypot?.value.trim()) {
      formStatus.textContent = "This request could not be processed.";
      return;
    }

    if (consent && !consent.checked) {
      consent.reportValidity();
      return;
    }

    const reference = `DWB-LR-${Math.floor(1000 + Math.random() * 9000)}`;
    const total = money.format(calculateLeaveCost());
    formStatus.textContent = `Reference ${reference} generated locally. Estimated replacement cover: ${total}. Connect the secure backend and payment workflow before accepting live applications.`;
  });
}

calculateLeaveCost();
window.lucide?.createIcons();
