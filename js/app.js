(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = "amrutaInvoiceDataV1";
  const defaultItems = [
    {desc:"Designer Outfit Customization", qty:1, price:3500},
    {desc:"Embroidery & Alteration", qty:1, price:1200}
  ];
  let items = defaultItems.map(x => ({...x}));

  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset()*60000).toISOString().slice(0,10);
  if ($("invoiceDate")) $("invoiceDate").value = localDate;

  function money(value) {
    return Number(value || 0).toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    })[ch]);
  }
  function getData() {
    return {
      company:$("company").value, address:$("address").value,
      companyPhone:$("companyPhone").value, instagram:$("instagram").value,
      invoiceNo:$("invoiceNo").value, invoiceDate:$("invoiceDate").value,
      clientName:$("clientName").value, clientPhone:$("clientPhone").value,
      items
    };
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getData())); }
    catch(e) { console.warn("Could not save invoice data", e); }
  }
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!data) return;
      ["company","address","companyPhone","instagram","invoiceNo","invoiceDate","clientName","clientPhone"].forEach(key => {
        if (data[key] !== undefined && $(key)) $(key).value = data[key];
      });
      if (Array.isArray(data.items) && data.items.length) {
        items = data.items.map(item => ({
          desc:String(item.desc ?? ""),
          qty:Math.max(0, Number(item.qty) || 0),
          price:Math.max(0, Number(item.price) || 0)
        }));
      }
    } catch(e) { console.warn("Saved invoice data could not be loaded", e); }
  }
  function render() {
    if (!$("itemsEditor")) return;
    $("itemsEditor").innerHTML = items.map((item,index) => `
      <div class="item-card">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="small fw-bold text-secondary">ITEM ${index+1}</span>
          ${items.length > 1 ? `<button type="button" class="btn btn-sm btn-link text-danger p-0 remove-item" data-index="${index}" aria-label="Remove item"><i class="bi bi-trash"></i> Remove</button>` : ""}
        </div>
        <label class="small-label mb-1" for="desc-${index}">Description</label>
        <input id="desc-${index}" class="form-control mb-2 item-desc" data-index="${index}" value="${escapeHTML(item.desc)}">
        <div class="row g-2">
          <div class="col-6"><label class="small-label mb-1" for="qty-${index}">Quantity</label><input id="qty-${index}" class="form-control item-qty" data-index="${index}" type="number" min="0" step="1" value="${item.qty}"></div>
          <div class="col-6"><label class="small-label mb-1" for="price-${index}">Unit price (₹)</label><input id="price-${index}" class="form-control item-price" data-index="${index}" type="number" min="0" step="0.01" value="${item.price}"></div>
        </div>
      </div>`).join("");

    $("previewItems").innerHTML = items.map(item => {
      const total = item.qty * item.price;
      return `<tr><td>${escapeHTML(item.desc) || '<em>Unnamed item</em>'}</td><td class="text-center">${item.qty}</td><td class="text-end">₹${money(item.price)}</td><td class="text-end fw-semibold">₹${money(total)}</td></tr>`;
    }).join("");
    const total = items.reduce((sum,item) => sum + item.qty*item.price, 0);
    $("grandTotal").textContent = "₹" + money(total);

    $("pCompany").textContent = $("company").value;
    $("pAddress").textContent = $("address").value;
    $("pCompanyPhone").textContent = $("companyPhone").value;
    $("pInstagram").textContent = $("instagram").value;
    $("pFooterInstagram").textContent = $("instagram").value;
    $("pInvoiceNo").textContent = $("invoiceNo").value;
    $("pDate").textContent = $("invoiceDate").value;
    const hasClient = $("clientName").value.trim() || $("clientPhone").value.trim();
    $("billTo").hidden = !hasClient;
    $("pClientName").textContent = $("clientName").value;
    $("pClientPhone").textContent = $("clientPhone").value;
    save();
  }

  $("itemsEditor").addEventListener("input", event => {
    const index = Number(event.target.dataset.index);
    if (!Number.isInteger(index) || !items[index]) return;
    if (event.target.classList.contains("item-desc")) items[index].desc = event.target.value;
    if (event.target.classList.contains("item-qty")) items[index].qty = Math.max(0, Number(event.target.value) || 0);
    if (event.target.classList.contains("item-price")) items[index].price = Math.max(0, Number(event.target.value) || 0);
    renderPreviewOnly();
    save();
  });
  $("itemsEditor").addEventListener("click", event => {
    const button = event.target.closest(".remove-item");
    if (!button) return;
    items.splice(Number(button.dataset.index),1);
    render();
  });
  function renderPreviewOnly() {
    $("previewItems").innerHTML = items.map(item => {
      const total = item.qty*item.price;
      return `<tr><td>${escapeHTML(item.desc) || '<em>Unnamed item</em>'}</td><td class="text-center">${item.qty}</td><td class="text-end">₹${money(item.price)}</td><td class="text-end fw-semibold">₹${money(total)}</td></tr>`;
    }).join("");
    $("grandTotal").textContent = "₹" + money(items.reduce((sum,item)=>sum+item.qty*item.price,0));
  }
  ["company","address","companyPhone","instagram","invoiceNo","invoiceDate","clientName","clientPhone"].forEach(id => {
    if ($(id)) {
      $(id).addEventListener("input", render);
      $(id).addEventListener("change", render);
    }
  });

  $("addItem").addEventListener("click", () => {
    items.push({desc:"New Service Item",qty:1,price:0});
    render();
    const inputs = $("itemsEditor").querySelectorAll(".item-desc");
    if (inputs.length) inputs[inputs.length-1].focus();
  });
  $("toggleBusiness").addEventListener("click", () => {
    const fields = $("businessFields");
    fields.hidden = !fields.hidden;
    $("toggleBusiness").innerHTML = fields.hidden
      ? '<i class="bi bi-pencil-square me-1"></i>Edit'
      : '<i class="bi bi-eye-slash me-1"></i>Hide';
  });
  $("printButton").addEventListener("click", () => window.print());
  $("clearButton").addEventListener("click", () => {
    if (!confirm("Reset all invoice items to the sample items?")) return;
    items = defaultItems.map(x=>({...x}));
    render();
  });
  $("whatsappButton").addEventListener("click", () => {
    const total = items.reduce((sum,item)=>sum+item.qty*item.price,0);
    const lines = [
      "*" + ($("company").value || "Invoice") + "*",
      "Invoice: " + $("invoiceNo").value,
      "Date: " + $("invoiceDate").value
    ];
    if ($("clientName").value.trim()) lines.push("Customer: " + $("clientName").value.trim());
    lines.push("", "*Invoice details*");
    items.forEach((item,index) => {
      lines.push(`${index+1}. ${item.desc || "Item"} | Qty: ${item.qty} | ₹${money(item.price)} | Total: ₹${money(item.qty*item.price)}`);
    });
    lines.push("", "*Grand Total: ₹" + money(total) + "*", "", "Thank you for your business!");
    const phone = $("clientPhone").value.replace(/\D/g,"");
    const url = phone
      ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(lines.join("\n"))
      : "https://wa.me/?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url,"_blank","noopener,noreferrer");
  });

  load();
  render();
})();
