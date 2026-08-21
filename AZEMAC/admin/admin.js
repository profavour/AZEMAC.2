// ==========================================
// AZEMAC ADMIN — LOGIN (Supabase Auth)
// ==========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const loginMessage =
            document.getElementById("loginMessage");

        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            if (loginMessage) {
                loginMessage.style.color = "red";
                loginMessage.textContent = "Invalid email or password.";
            }

            return;

        }

        window.location.href = "dashboard.html";

    });

}


// ==========================================
// FORGOT PASSWORD (Supabase's built-in email flow)
// ==========================================

const loginSection = document.getElementById("loginSection");
const resetRequestSection = document.getElementById("resetRequestSection");

const forgotPasswordLink = document.getElementById("forgotPassword");
const resetRequestForm = document.getElementById("resetRequestForm");
const backToLoginFromRequest = document.getElementById("backToLoginFromRequest");

function showSection(section) {

    [loginSection, resetRequestSection].forEach(function (el) {
        if (el) el.style.display = "none";
    });

    if (section) section.style.display = "block";

}

if (forgotPasswordLink) {

    forgotPasswordLink.addEventListener("click", function (event) {
        event.preventDefault();
        showSection(resetRequestSection);
    });

}

if (backToLoginFromRequest) {

    backToLoginFromRequest.addEventListener("click", function (event) {
        event.preventDefault();
        showSection(loginSection);
    });

}

if (resetRequestForm) {

    resetRequestForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const statusEl = document.getElementById("resetRequestMessage");

        const email =
            document.getElementById("resetEmail").value.trim();

        if (statusEl) {
            statusEl.style.color = "#555";
            statusEl.textContent = "Sending reset link...";
        }

        const redirectUrl =
            window.location.origin +
            window.location.pathname.replace("login.html", "reset-password.html");

        const { error } =
            await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            });

        if (error) {

            if (statusEl) {
                statusEl.style.color = "red";
                statusEl.textContent = "Couldn't send reset email. Please try again.";
            }

            return;

        }

        if (statusEl) {
            statusEl.style.color = "green";
            statusEl.textContent =
                "If that email is registered, a reset link has been sent. Check your inbox.";
        }

    });

}


// ==========================================
// DASHBOARD AUTH GUARD
// ==========================================

const dashboardMain = document.getElementById("dashboardMain");

if (dashboardMain) {

    (async function guardDashboard() {

        const { data } = await supabaseClient.auth.getSession();

        if (!data.session) {
            window.location.href = "login.html";
        }

    })();

}


// ==========================================
// AZEMAC ADMIN DASHBOARD
// ==========================================

const addPropertyBtn = document.getElementById("addPropertyBtn");
const addPropertySection = document.getElementById("addPropertySection");
const cancelAddProperty = document.getElementById("cancelAddProperty");
const propertyForm = document.getElementById("propertyForm");


// =========================
// OPEN / CANCEL ADD PROPERTY FORM
// =========================

if (addPropertyBtn) {

    addPropertyBtn.addEventListener("click", function () {

        addPropertySection.style.display = "block";
        addPropertySection.scrollIntoView({ behavior: "smooth" });

    });

}

function resetPropertyForm() {

    propertyForm.reset();
    delete propertyForm.dataset.editingId;

    addPropertySection.querySelector("h2").textContent = "Add New Property";
    propertyForm.querySelector("button[type='submit']").textContent = "Add Property";

    const preview = document.getElementById("propertyImagePreview");

    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }

}

if (cancelAddProperty) {

    cancelAddProperty.addEventListener("click", function () {
        addPropertySection.style.display = "none";
        resetPropertyForm();
    });

}


// =========================
// ADD / EDIT PROPERTY (Supabase)
// =========================

if (propertyForm) {

    propertyForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const price =
            Number(document.getElementById("propertyPrice").value);

        if (!Number.isFinite(price) || price <= 0) {
            alert("Please enter a valid property price greater than ₦0.");
            return;
        }

        const propertyData = {
            name: document.getElementById("propertyName").value.trim(),
            location: document.getElementById("propertyLocation").value.trim(),
            type: document.getElementById("propertyType").value.toLowerCase(),
            price: price,
            bedrooms: document.getElementById("propertyBedrooms").value || "—",
            bathrooms: document.getElementById("propertyBathrooms").value || "—",
            parking: document.getElementById("propertyParking").value || "—",
            size: document.getElementById("propertySize").value || "—",
            status: document.getElementById("propertyStatus").value,
            image: document.getElementById("propertyImage").value.trim(),
            description: document.getElementById("propertyDescription").value.trim(),
            map_url: document.getElementById("propertyMapUrl").value.trim()
        };

        const editingId = propertyForm.dataset.editingId;

        let error;

        if (editingId) {

            ({ error } = await supabaseClient
                .from("properties")
                .update(propertyData)
                .eq("id", Number(editingId)));

        } else {

            ({ error } = await supabaseClient
                .from("properties")
                .insert([propertyData]));

        }

        if (error) {
            console.error("Save property error:", error);
            alert("Something went wrong saving the property. Please try again.");
            return;
        }

        alert(editingId ? "Property updated successfully! ✅" : "Property added successfully! 🏠");

        addPropertySection.style.display = "none";
        resetPropertyForm();

        loadProperties();

    });

}


// =========================
// LOAD PROPERTIES INTO TABLE
// =========================

async function loadProperties() {

    const tableBody = document.getElementById("propertyTableBody");

    if (!tableBody) return;

    const properties = await fetchAllProperties();

    tableBody.innerHTML = "";

    properties.forEach(function (property) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><strong>${property.name}</strong></td>
            <td>${property.location}</td>
            <td>₦${Number(property.price).toLocaleString()}</td>
            <td><span class="status sale">${property.status}</span></td>
            <td class="actions">
                <button class="edit-btn" onclick="editProperty(${property.id})">Edit</button>
                <button class="delete-btn" onclick="deleteProperty(${property.id})">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);

    });

    updateStatistics(properties);

}


// =========================
// DELETE PROPERTY
// =========================

async function deleteProperty(id) {

    const confirmed = confirm("Are you sure you want to delete this property?");

    if (!confirmed) return;

    const { error } =
        await supabaseClient.from("properties").delete().eq("id", id);

    if (error) {
        console.error("Delete property error:", error);
        alert("Couldn't delete this property. Please try again.");
        return;
    }

    alert("Property deleted successfully! 🗑️");

    loadProperties();

}


// =========================
// EDIT PROPERTY
// =========================

async function editProperty(id) {

    const property = await fetchPropertyById(id);

    if (!property) {
        alert("Property not found.");
        return;
    }

    addPropertySection.style.display = "block";
    addPropertySection.scrollIntoView({ behavior: "smooth" });

    addPropertySection.querySelector("h2").textContent = "Edit Property";

    document.getElementById("propertyName").value = property.name;
    document.getElementById("propertyLocation").value = property.location;
    document.getElementById("propertyType").value = property.type;
    document.getElementById("propertyPrice").value = property.price;
    document.getElementById("propertyBedrooms").value = property.bedrooms === "—" ? "" : property.bedrooms;
    document.getElementById("propertyBathrooms").value = property.bathrooms === "—" ? "" : property.bathrooms;
    document.getElementById("propertyParking").value = property.parking === "—" ? "" : property.parking;
    document.getElementById("propertySize").value = property.size === "—" ? "" : property.size;
    document.getElementById("propertyStatus").value = property.status;
    document.getElementById("propertyImage").value = property.image;
    document.getElementById("propertyDescription").value = property.description;
    document.getElementById("propertyMapUrl").value = property.map_url || "";

    propertyForm.querySelector("button[type='submit']").textContent = "Save Changes";
    propertyForm.dataset.editingId = id;

}


// =========================
// STATISTICS
// =========================

function updateStatistics(properties) {

    const totalEl = document.getElementById("totalProperties");

    if (!totalEl) return;

    const total = properties.length;
    const sale = properties.filter(p => p.status === "FOR SALE").length;
    const rent = properties.filter(p => p.status === "FOR RENT").length;
    const sold = properties.filter(p => p.status === "SOLD").length;

    totalEl.textContent = total;
    document.getElementById("saleProperties").textContent = sale;
    document.getElementById("rentProperties").textContent = rent;
    document.getElementById("soldProperties").textContent = sold;

}


// =========================
// LOGOUT
// =========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
    });

}


// =========================
// IMAGE PREVIEW
// =========================

const propertyImageInput = document.getElementById("propertyImage");
const propertyImagePreview = document.getElementById("propertyImagePreview");

if (propertyImageInput && propertyImagePreview) {

    propertyImageInput.addEventListener("input", function () {

        const url = propertyImageInput.value.trim();

        if (!url) {
            propertyImagePreview.style.display = "none";
            propertyImagePreview.removeAttribute("src");
            return;
        }

        propertyImagePreview.src = url;
        propertyImagePreview.style.display = "block";

    });

    propertyImagePreview.addEventListener("error", function () {
        propertyImagePreview.style.display = "none";
    });

}


// =========================
// START
// =========================

if (document.getElementById("propertyTableBody")) {
    loadProperties();
}
