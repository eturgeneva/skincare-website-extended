const storage = {
  get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const catalog = [
  { name: "Radiance Revive Serum", category: "Serum", concern: "Dullness", price: 58, image: "./resources/images/custom-blended-moisture-building-essence.jpg", href: "./product.html" },
  { name: "Radiance Revive Cleanser", category: "Cleanser", concern: "Sensitivity", price: 42, image: "./resources/images/custom-blended-milk-cleanser.jpg", href: "./product.html" },
  { name: "Radiance Revive Cream", category: "Moisturizer", concern: "Dryness", price: 64, image: "./resources/images/custom-blended-conditioning-cream.jpg", href: "./product.html" }
];

let cart = storage.get("pureglow-cart");
let wishlist = storage.get("pureglow-wishlist");
let toastTimer;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const productFrom = element => {
  const card = element.closest("[data-product-card]");
  return {
    name: card.dataset.name,
    category: card.dataset.category,
    concern: card.dataset.concern,
    price: Number(card.dataset.price),
    image: card.dataset.image,
    href: "./product.html"
  };
};
const formatMoney = value => `$${Math.max(0, Math.round(value))}`;
const cartSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

function showToast(message) {
  const toast = $("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateCounts() {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  $$("[data-cart-count]").forEach(el => {
    el.textContent = cartCount;
    el.hidden = cartCount === 0;
  });
  $$("[data-wishlist-count]").forEach(el => {
    el.textContent = wishlist.length;
    el.hidden = wishlist.length === 0;
  });
  $$("[data-cart-total-count]").forEach(el => el.textContent = `(${cartCount})`);
  $$("[data-wishlist]").forEach(button => {
    const product = productFrom(button);
    button.classList.toggle("active", wishlist.some(item => item.name === product.name));
  });
}

function addToCart(product, quantity = 1) {
  const existing = cart.find(item => item.name === product.name);
  if (existing) existing.quantity += quantity;
  else cart.push({ ...product, quantity });
  storage.set("pureglow-cart", cart);
  updateCounts();
  renderCart();
  renderProfile();
  showToast(`${product.name} added to your bag`);
}

function renderCart() {
  const container = $("[data-cart-items]");
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = '<div class="empty-state"><b>Your bag is taking a breath.</b><p>Add a formula to begin your ritual.</p></div>';
  } else {
    container.innerHTML = cart.map((item, index) => `
      <article class="drawer-item">
        <img src="${item.image}" alt="">
        <div><h3>${item.name}</h3><p>${item.category} · Qty ${item.quantity}<br>$${item.price * item.quantity}</p></div>
        <button type="button" data-remove-cart="${index}" aria-label="Remove ${item.name}">×</button>
      </article>`).join("");
  }
  const subtotal = cartSubtotal();
  const footer = $("[data-cart-footer]");
  if (footer) footer.hidden = cart.length === 0;
  const subtotalEl = $("[data-cart-subtotal]");
  if (subtotalEl) subtotalEl.textContent = `$${subtotal}`;
}

function renderWishlist() {
  const container = $("[data-wishlist-items]");
  if (!container) return;
  if (!wishlist.length) {
    container.innerHTML = '<div class="empty-state"><b>Nothing saved yet.</b><p>Use the heart icon to build a considered edit.</p></div>';
  } else {
    container.innerHTML = wishlist.map((item, index) => `
      <article class="drawer-item">
        <img src="${item.image}" alt="">
        <div><h3>${item.name}</h3><p>${item.category}<br>$${item.price}</p><button class="text-button" type="button" data-wishlist-add="${index}">Add to bag</button></div>
        <button type="button" data-remove-wishlist="${index}" aria-label="Remove ${item.name}">×</button>
      </article>`).join("");
  }
}

function renderProfile() {
  const profilePage = $("[data-page='profile']");
  if (!profilePage) return;

  const profile = storage.get("pureglow-profile", {
    name: "Elena Studio",
    email: "elena@example.com",
    skin: "Combination",
    concern: "Dullness"
  });
  const routine = storage.get("pureglow-routine", {});
  const lastOrder = storage.get("pureglow-last-order", null);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  $("[data-profile-name]").textContent = profile.name;
  $("[data-profile-email]").textContent = profile.email;
  $("[data-profile-skin]").textContent = profile.skin;
  $("[data-profile-concern]").textContent = profile.concern;
  $("[data-profile-saved-count]").textContent = wishlist.length;
  $("[data-profile-bag-count]").textContent = cartCount;
  $("[data-profile-routine]").textContent = routine.concern ? `${routine.concern} ritual` : "Not started";

  const form = $("[data-profile-form]");
  if (form) {
    form.elements.name.value = profile.name;
    form.elements.email.value = profile.email;
    form.elements.skin.value = profile.skin;
    form.elements.concern.value = profile.concern;
  }

  const orderContainer = $("[data-profile-order]");
  if (orderContainer) {
    orderContainer.innerHTML = lastOrder ? `
      <article class="profile-order">
        <div><span>Order</span><strong>${lastOrder.orderNumber}</strong></div>
        <div><span>Delivery</span><strong>${lastOrder.shipping}</strong></div>
        <div><span>Payment</span><strong>${lastOrder.payment || "Saved payment method"}</strong></div>
        <div><span>Items</span><strong>${lastOrder.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
        <p>${lastOrder.items.map(item => `${item.quantity} × ${item.name}`).join(" · ")}</p>
      </article>` : `
      <div class="profile-empty">
        <b>No concept orders yet.</b>
        <p>Place an order through checkout and it will appear here as local frontend state.</p>
        <a class="button button--outline button--small" href="./checkout.html">Open checkout</a>
      </div>`;
  }

  const savedContainer = $("[data-profile-saved]");
  if (savedContainer) {
    savedContainer.innerHTML = wishlist.length ? wishlist.map((item, index) => `
      <article class="profile-saved-card">
        <img src="${item.image}" alt="">
        <div>
          <p>${item.category} · ${item.concern}</p>
          <h3>${item.name}</h3>
          <span>$${item.price}</span>
        </div>
        <button class="button button--outline button--small" type="button" data-profile-add="${index}">Add to bag</button>
      </article>`).join("") : `
      <div class="profile-empty">
        <b>Your saved shelf is quiet.</b>
        <p>Use the heart icon on products to curate a personal edit.</p>
        <a class="button button--outline button--small" href="./index.html#bestsellers">Browse products</a>
      </div>`;
  }
}

function closePanels() {
  $$("[data-cart-drawer], [data-wishlist-drawer]").forEach(el => {
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  });
  const overlay = $("[data-overlay]");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("locked");
}

function openDrawer(selector) {
  closePanels();
  const drawer = $(selector);
  const overlay = $("[data-overlay]");
  if (!drawer || !overlay) return;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.classList.add("locked");
}

function initGlobalUI() {
  const header = $(".site-header");
  window.addEventListener("scroll", () => header?.classList.toggle("scrolled", scrollY > 20), { passive: true });
  $(".announcement__close")?.addEventListener("click", event => event.currentTarget.parentElement.remove());

  $("[data-menu-toggle]")?.addEventListener("click", event => {
    const links = $(".nav__links");
    const isOpen = links.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", isOpen);
    document.body.classList.toggle("locked", isOpen);
  });
  $$(".nav__links a").forEach(link => link.addEventListener("click", () => {
    $(".nav__links")?.classList.remove("open");
    document.body.classList.remove("locked");
  }));

  $$("[data-open-cart]").forEach(button => button.addEventListener("click", () => openDrawer("[data-cart-drawer]")));
  $$("[data-open-wishlist]").forEach(button => button.addEventListener("click", () => { renderWishlist(); openDrawer("[data-wishlist-drawer]"); }));
  $$("[data-close-drawer]").forEach(button => button.addEventListener("click", closePanels));
  $("[data-overlay]")?.addEventListener("click", closePanels);

  $$("[data-add-cart]").forEach(button => button.addEventListener("click", () => {
    const quantity = Number($("[data-quantity]")?.value || $("[data-quantity]")?.textContent || 1);
    addToCart(productFrom(button), quantity);
  }));
  $("[data-mobile-add]")?.addEventListener("click", () => {
    const card = $(".product-detail");
    addToCart({
      name: card.dataset.name, category: card.dataset.category, concern: card.dataset.concern,
      price: Number(card.dataset.price), image: card.dataset.image, href: "./product.html"
    });
  });
  $$("[data-wishlist]").forEach(button => button.addEventListener("click", () => {
    const product = productFrom(button);
    const index = wishlist.findIndex(item => item.name === product.name);
    if (index >= 0) { wishlist.splice(index, 1); showToast(`${product.name} removed from saved pieces`); }
    else { wishlist.push(product); showToast(`${product.name} saved`); }
    storage.set("pureglow-wishlist", wishlist);
    updateCounts();
    renderWishlist();
    renderProfile();
  }));

  document.addEventListener("click", event => {
    const removeCart = event.target.closest("[data-remove-cart]");
    const removeWishlist = event.target.closest("[data-remove-wishlist]");
    const wishlistAdd = event.target.closest("[data-wishlist-add]");
    if (removeCart) {
      cart.splice(Number(removeCart.dataset.removeCart), 1);
      storage.set("pureglow-cart", cart); updateCounts(); renderCart(); renderCheckout(); renderProfile();
    }
    if (removeWishlist) {
      wishlist.splice(Number(removeWishlist.dataset.removeWishlist), 1);
      storage.set("pureglow-wishlist", wishlist); updateCounts(); renderWishlist(); renderProfile();
    }
    if (wishlistAdd) addToCart(wishlist[Number(wishlistAdd.dataset.wishlistAdd)]);
  });

  $$("[data-demo-link]").forEach(element => element.addEventListener("click", event => {
    event.preventDefault();
    showToast("Concept interaction — no external action is taken");
  }));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { closePanels(); closeSearch(); }
  });

  renderCart();
  renderWishlist();
  updateCounts();
  renderProfile();
}

function renderCheckout() {
  const checkout = $("[data-checkout]");
  if (!checkout) return;

  const items = $("[data-checkout-items]");
  const subtotalEl = $("[data-checkout-subtotal]");
  const shippingEl = $("[data-checkout-shipping]");
  const taxEl = $("[data-checkout-tax]");
  const discountEl = $("[data-checkout-discount]");
  const totalEl = $("[data-checkout-total]");
  const countEl = $("[data-checkout-total-count]");
  const discountRow = $("[data-discount-row]");
  const submit = $("[data-checkout-form] button[type='submit']");
  const selectedShipping = $("[name='shipping']:checked");

  const subtotal = cartSubtotal();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = subtotal ? (subtotal >= 75 ? Number(selectedShipping?.value || 0) : Math.max(8, Number(selectedShipping?.value || 0))) : 0;
  const hasPromo = storage.get("pureglow-promo", null) === "GLOW10";
  const discount = hasPromo ? subtotal * 0.1 : 0;
  const tax = subtotal ? (subtotal - discount + shipping) * 0.0825 : 0;
  const total = subtotal - discount + shipping + tax;

  if (items) {
    items.innerHTML = cart.length ? cart.map((item, index) => `
      <article class="checkout-item">
        <div class="checkout-item__image">
          <img src="${item.image}" alt="">
          <span>${item.quantity}</span>
        </div>
        <div>
          <h3>${item.name}</h3>
          <p>${item.category} · ${item.concern}</p>
          <button type="button" data-remove-cart="${index}">Remove</button>
        </div>
        <strong>${formatMoney(item.price * item.quantity)}</strong>
      </article>`).join("") : `
      <div class="checkout-empty">
        <b>Your bag is empty.</b>
        <p>Add a formula to preview the full checkout experience.</p>
        <a class="button button--outline button--small" href="./index.html#bestsellers">Shop essentials</a>
      </div>`;
  }

  if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
  if (shippingEl) shippingEl.textContent = subtotal ? (shipping ? formatMoney(shipping) : "Free") : "—";
  if (taxEl) taxEl.textContent = subtotal ? formatMoney(tax) : "$0";
  if (discountEl) discountEl.textContent = `−${formatMoney(discount)}`;
  if (discountRow) discountRow.hidden = !hasPromo;
  if (totalEl) totalEl.textContent = formatMoney(total);
  if (countEl) countEl.textContent = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
  if (submit) submit.disabled = cart.length === 0;
}

function initCheckout() {
  const checkout = $("[data-checkout]");
  if (!checkout) return;

  renderCheckout();

  $$("[name='shipping']").forEach(input => input.addEventListener("change", () => {
    renderCheckout();
    showToast(`${input.dataset.shippingLabel} selected`);
  }));

  $$("[data-express-pay]").forEach(button => button.addEventListener("click", () => {
    showToast(`${button.dataset.expressPay} selected — demo state only`);
  }));

  const togglePaymentFields = () => {
    const newPayment = $("[name='payment']:checked")?.value === "new";
    const panel = $("[data-new-payment]");
    if (panel) panel.hidden = !newPayment;
    if (!newPayment) $$("[data-payment-field]").forEach(input => input.closest(".field")?.classList.remove("invalid"));
  };
  $$("[name='payment']").forEach(input => input.addEventListener("change", () => {
    togglePaymentFields();
    showToast(input.value === "new" ? "New payment form opened" : "Saved payment method selected");
  }));
  togglePaymentFields();

  $("[data-promo-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const input = event.currentTarget.elements.promo;
    const code = input.value.trim().toUpperCase();
    if (code === "GLOW10") {
      storage.set("pureglow-promo", "GLOW10");
      showToast("GLOW10 applied — 10% concept discount");
    } else if (code) {
      storage.set("pureglow-promo", null);
      showToast("Try GLOW10 for the portfolio promo");
    }
    input.value = "";
    renderCheckout();
  });

  $("[data-checkout-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!cart.length) {
      showToast("Add a product before placing an order");
      return;
    }

    let firstInvalid;
    $$("input[required]", form).forEach(input => {
      const invalid = !input.checkValidity() || !input.value.trim();
      input.closest(".field")?.classList.toggle("invalid", invalid);
      if (invalid && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      showToast("A few details need attention");
      return;
    }

    const selectedShipping = $("[name='shipping']:checked");
    const selectedPayment = $("[name='payment']:checked");
    if (selectedPayment?.value === "new") {
      $$("[data-payment-field]").forEach(input => {
        const invalid = !input.value.trim();
        input.closest(".field")?.classList.toggle("invalid", invalid);
        if (invalid && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showToast("Add payment details or use the saved method");
        return;
      }
    }
    const firstName = form.elements.firstName.value.trim();
    const orderNumber = `PG-${Math.floor(1000 + Math.random() * 9000)}`;
    storage.set("pureglow-last-order", {
      orderNumber,
      shipping: selectedShipping?.dataset.shippingLabel || "Complimentary ground",
      payment: selectedPayment?.value === "new" ? "New payment method" : "Saved payment method",
      items: cart,
      placedAt: new Date().toISOString()
    });
    cart = [];
    storage.set("pureglow-cart", cart);
    storage.set("pureglow-promo", null);
    updateCounts();
    renderCart();
    renderCheckout();
    renderProfile();

    $("[data-order-number]").textContent = orderNumber;
    $("[data-order-delivery]").textContent = selectedShipping?.dataset.shippingLabel || "Complimentary ground";
    $("[data-order-message]").textContent = `Thank you${firstName ? `, ${firstName}` : ""} — your concept order has been placed.`;
    checkout.hidden = true;
    $("[data-order-success]").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("input", event => {
    if (event.target.matches("[data-checkout-form] input")) event.target.closest(".field")?.classList.remove("invalid");
  });
}

function initSearch() {
  const panel = $("[data-search-panel]");
  const input = $("[data-search-input]");
  const results = $("[data-search-results]");
  if (!panel || !input || !results) return;
  const render = query => {
    const matches = catalog.filter(product => `${product.name} ${product.category} ${product.concern}`.toLowerCase().includes(query.toLowerCase()));
    results.innerHTML = (query ? matches : catalog).map(product => `
      <a class="search-result" href="${product.href}">
        <img src="${product.image}" alt="">
        <div><b>${product.name}</b><p>${product.category} · ${product.concern}<br>$${product.price}</p></div>
      </a>`).join("") || '<p>No matches yet. Try “serum”, “dryness” or “cleanser”.</p>';
  };
  $$("[data-open-search]").forEach(button => button.addEventListener("click", () => {
    panel.hidden = false; document.body.classList.add("locked"); render(""); setTimeout(() => input.focus(), 50);
  }));
  $("[data-close-search]")?.addEventListener("click", closeSearch);
  input.addEventListener("input", () => render(input.value.trim()));
}

function closeSearch() {
  const panel = $("[data-search-panel]");
  if (panel) panel.hidden = true;
  document.body.classList.remove("locked");
}

function initReveal() {
  const elements = $$(".reveal");
  if (!("IntersectionObserver" in window)) return elements.forEach(el => el.classList.add("visible"));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: .12 });
  elements.forEach(el => observer.observe(el));
}

function initRoutine() {
  const finder = $("[data-routine]");
  if (!finder) return;
  const answers = {};
  const goTo = step => {
    $$(".routine-step", finder).forEach(el => { el.hidden = el.dataset.step !== String(step); el.classList.toggle("active", el.dataset.step === String(step)); });
    $$(".routine__progress span").forEach((el, index) => el.classList.toggle("active", index < step));
  };
  $$("[data-routine-answer]", finder).forEach(button => button.addEventListener("click", () => {
    answers[button.dataset.routineAnswer] = button.dataset.value;
    if (button.dataset.routineAnswer === "concern") goTo(2);
    else { storage.set("pureglow-routine", answers); goTo(3); showToast("Your tailored ritual is ready"); }
  }));
  $("[data-routine-reset]")?.addEventListener("click", () => goTo(1));
  $("[data-add-routine]")?.addEventListener("click", () => {
    catalog.forEach(product => addToCart(product));
    openDrawer("[data-cart-drawer]");
  });
}

function initProduct() {
  let quantity = 1;
  const output = $("[data-quantity]");
  $("[data-quantity-minus]")?.addEventListener("click", () => { quantity = Math.max(1, quantity - 1); output.value = quantity; output.textContent = quantity; });
  $("[data-quantity-plus]")?.addEventListener("click", () => { quantity = Math.min(9, quantity + 1); output.value = quantity; output.textContent = quantity; });
  $$("[data-gallery-thumb]").forEach(button => button.addEventListener("click", () => {
    $("[data-gallery-main]").src = button.dataset.src;
    $$("[data-gallery-thumb]").forEach(el => el.classList.toggle("active", el === button));
  }));
}

function initForms() {
  $("[data-newsletter]")?.addEventListener("submit", event => {
    event.preventDefault();
    const input = $("input", event.currentTarget);
    showToast(`Thanks — ${input.value} is on the concept list`);
    event.currentTarget.reset();
  });
}

function initProfile() {
  const form = $("[data-profile-form]");
  if (!form) return;

  renderProfile();

  form.addEventListener("submit", event => {
    event.preventDefault();
    const profile = {
      name: form.elements.name.value.trim() || "PureGlow Member",
      email: form.elements.email.value.trim() || "member@example.com",
      skin: form.elements.skin.value,
      concern: form.elements.concern.value
    };
    storage.set("pureglow-profile", profile);
    renderProfile();
    showToast("Profile preferences saved locally");
  });

  document.addEventListener("click", event => {
    const add = event.target.closest("[data-profile-add]");
    if (add) addToCart(wishlist[Number(add.dataset.profileAdd)]);
  });
}

function initAdmin() {
  if (document.body.dataset.page !== "admin") return;

  $$("[data-admin-action]").forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    const label = button.textContent.trim() || "Action";
    showToast(`${label} is a frontend demo action`);
  }));

  $$("[data-admin-save]").forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    storage.set("pureglow-admin-draft", { savedAt: new Date().toISOString(), page: document.title });
    showToast("Admin draft saved locally");
  }));
}

initGlobalUI();
initSearch();
initReveal();
initRoutine();
initProduct();
initForms();
initCheckout();
initProfile();
initAdmin();
