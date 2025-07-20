document.addEventListener('DOMContentLoaded', () => {
    // The base URL for the backend API.
    const API_URL = 'http://localhost:3000';

    // --- STATE ---
    // The state now holds the application's status, but not the data itself.
    let state = {
        isAuthenticated: false,
        currentUser: null,
        userRole: null,
        activeTab: 'lost-and-found',
    };

    // --- DOM ELEMENTS ---
    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('app');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const loggedInUser = document.getElementById('loggedInUser');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const modals = {
        report: document.getElementById('reportLostItemModal'),
        upload: document.getElementById('adminUploadModal'),
        message: document.getElementById('createMessageModal'),
        success: document.getElementById('successModal'),
    };

    const itemsGrid = document.getElementById('itemsGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const noResultsP = document.getElementById('noResults');
    
    const messageList = document.getElementById('messageList');
    const messageDetail = document.getElementById('messageDetail');

    const viewReportsBtn = document.getElementById('viewReportsBtn');
    const lostReportsSection = document.getElementById('lostReportsSection');
    const reportsList = document.getElementById('reportsList');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // --- API HELPER FUNCTIONS ---
    // Shows a loading spinner.
    const showLoading = () => loadingIndicator.classList.remove('hidden');
    // Hides the loading spinner.
    const hideLoading = () => loadingIndicator.classList.add('hidden');

    // --- RENDER FUNCTIONS ---
    // These functions now take data as an argument, fetched from the API.
    const renderUI = () => {
        if (!state.isAuthenticated) {
            loginScreen.style.display = 'flex';
            appScreen.classList.add('hidden');
            return;
        }
        
        loginScreen.style.display = 'none';
        appScreen.classList.remove('hidden');

        loggedInUser.textContent = state.currentUser.name;
        userRoleDisplay.textContent = state.userRole.charAt(0).toUpperCase() + state.userRole.slice(1);

        tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === state.activeTab);
        });
        tabContents.forEach(content => {
            content.classList.toggle('hidden', content.id !== state.activeTab);
        });
        
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        const studentOnlyElements = document.querySelectorAll('.student-only');
        
        adminOnlyElements.forEach(el => el.classList.toggle('hidden', state.userRole !== 'admin'));
        studentOnlyElements.forEach(el => el.classList.toggle('hidden', state.userRole !== 'student'));
    };

    const renderFoundItems = (items) => {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        
        const filteredItems = items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) || item.location.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || item.category === category;
            return matchesSearch && matchesCategory;
        });

        itemsGrid.innerHTML = '';
        if (filteredItems.length === 0) {
            noResultsP.classList.remove('hidden');
        } else {
            noResultsP.classList.add('hidden');
            filteredItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300';
                card.innerHTML = `
                    <img src="${item.img}" alt="${item.name}" class="w-full h-40 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x300/e2e8f0/475569?text=Image+Not+Found';">
                    <div class="p-4">
                        <h4 class="font-bold text-md text-slate-700">${item.name}</h4>
                        <p class="text-sm text-slate-500 mt-1"><strong>Found at:</strong> ${item.location}</p>
                        <p class="text-sm text-slate-500"><strong>Found on:</strong> ${item.date}</p>
                        <div class="mt-3 text-xs font-semibold uppercase text-sky-600 bg-sky-100 rounded-full px-2 py-1 inline-block">${item.category}</div>
                    </div>
                `;
                itemsGrid.appendChild(card);
            });
        }
    };
    
    const renderMessages = (messages) => {
        messageList.innerHTML = '';
        messages.forEach(msg => {
            const li = document.createElement('li');
            li.className = 'p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100';
            li.dataset.message = JSON.stringify(msg); // Store full message object
            li.innerHTML = `
                <h4 class="font-semibold text-slate-800">${msg.title}</h4>
                <p class="text-sm text-slate-500">From: ${msg.from} | ${msg.date}</p>
            `;
            messageList.appendChild(li);
        });
    };
    
    const renderMessageDetail = (msg) => {
        if (msg) {
            messageDetail.innerHTML = `
                <h3 class="text-xl font-bold text-slate-800 mb-2">${msg.title}</h3>
                <p class="text-sm text-slate-500 mb-4"><strong>From:</strong> ${msg.from} | <strong>Date:</strong> ${msg.date}</p>
                <div class="prose max-w-none text-slate-700">
                   <p>${msg.content.replace(/\n/g, '</p><p>')}</p>
                </div>
            `;
        }
    };

    const renderLostItemReports = (reports) => {
        if (!reportsList) return;
        reportsList.innerHTML = '';
        if (reports.length === 0) {
            reportsList.innerHTML = '<p class="text-slate-500 text-center p-4">No items have been reported lost yet.</p>';
            return;
        }
        reports.forEach(report => {
            const reportDiv = document.createElement('div');
            reportDiv.className = 'p-4 border-b border-slate-200 last:border-b-0';
            reportDiv.innerHTML = `
                <h4 class="font-bold text-slate-800">${report.itemName}</h4>
                <p class="text-sm text-slate-600 mt-1">${report.itemDesc}</p>
                <div class="text-xs text-slate-500 mt-2 flex justify-between">
                    <span><strong>Last Seen:</strong> ${report.location} on ${report.date}</span>
                    <span><strong>Reported by:</strong> ${report.reportedBy}</span>
                </div>
            `;
            reportsList.appendChild(reportDiv);
        });
    };

    // --- DATA FETCHING & INITIALIZATION on LOGIN ---
    const initializeAppData = async () => {
        showLoading();
        try {
            // Fetch all data in parallel for a faster load time.
            const [foundItemsRes, messagesRes] = await Promise.all([
                fetch(`${API_URL}/found-items`),
                fetch(`${API_URL}/messages`)
            ]);

            const foundItems = await foundItemsRes.json();
            const messages = await messagesRes.json();

            // Store data globally for filtering, or pass to render functions.
            window.foundItemsData = foundItems;
            window.messagesData = messages;

            renderFoundItems(foundItems);
            renderMessages(messages);
        } catch (error) {
            console.error("Failed to initialize app data:", error);
            alert("Could not connect to the server. Please try again later.");
        } finally {
            hideLoading();
        }
    };


    // --- AUTHENTICATION ---
    const handleLogin = async (e) => {
        e.preventDefault();
        showLoading();
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                loginError.classList.remove('hidden');
                return;
            }

            const user = await response.json();
            state.isAuthenticated = true;
            state.currentUser = user;
            state.userRole = user.role;
            loginError.classList.add('hidden');
            
            renderUI();
            await initializeAppData(); // Fetch data after successful login.

        } catch (error) {
            console.error("Login API error:", error);
            loginError.textContent = "Cannot connect to server.";
            loginError.classList.remove('hidden');
        } finally {
            hideLoading();
        }
    };

    const handleLogout = () => {
        state.isAuthenticated = false;
        state.currentUser = null;
        state.userRole = null;
        loginForm.reset();
        window.foundItemsData = []; // Clear cached data
        window.messagesData = [];
        renderUI();
    };

    // --- MODAL & FORM HANDLING ---
    const openModal = (modal) => modal.classList.add('active');
    const closeModal = (modal) => modal.classList.remove('active');

    const showSuccessMessage = (title, message) => {
        document.getElementById('successTitle').textContent = title;
        document.getElementById('successMessage').textContent = message;
        openModal(modals.success);
    };

    document.getElementById('reportLostItemBtn').addEventListener('click', () => openModal(modals.report));
    document.getElementById('adminUploadBtn').addEventListener('click', () => openModal(modals.upload));
    document.getElementById('createMessageBtn').addEventListener('click', () => openModal(modals.message));

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal')));
    });

    document.getElementById('closeSuccessModal').addEventListener('click', () => closeModal(modals.success));
    
    document.getElementById('lostItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const formData = new FormData(e.target);
        const newReport = {
            itemName: formData.get('itemName'),
            itemDesc: formData.get('itemDesc'),
            location: formData.get('location'),
            date: formData.get('date'),
            reportedBy: state.currentUser.name,
        };
        
        try {
            await fetch(`${API_URL}/lost-reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReport),
            });
            closeModal(modals.report);
            showSuccessMessage('Report Submitted!', 'Your report has been logged and is now visible to all college members.');
            e.target.reset();
        } catch (error) {
            alert('Failed to submit report.');
        } finally {
            hideLoading();
        }
    });
    
    document.getElementById('uploadItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const formData = new FormData(e.target); // This captures all form fields including the file
        
        try {
            const response = await fetch(`${API_URL}/found-items`, {
                method: 'POST',
                body: formData, // When sending FormData, the browser sets the correct headers automatically
            });

            if (!response.ok) throw new Error('Failed to upload item.');
            
            const newItem = await response.json();
            window.foundItemsData.unshift(newItem); // Add new item to the top of the list
            renderFoundItems(window.foundItemsData);

            closeModal(modals.upload);
            showSuccessMessage('Item Uploaded!', 'The item is now listed in the found items gallery.');
            e.target.reset();
        } catch (error) {
            alert(error.message);
        } finally {
            hideLoading();
        }
    });

    document.getElementById('messageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const formData = new FormData(e.target);
        const newMessage = {
            title: formData.get('title'),
            content: formData.get('content'),
            from: state.currentUser.name,
        };

        try {
             const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage),
            });
            const createdMessage = await response.json();
            window.messagesData.unshift(createdMessage);
            renderMessages(window.messagesData);

            closeModal(modals.message);
            showSuccessMessage('Broadcast Sent!', 'Your message has been sent.');
            e.target.reset();
        } catch (error) {
            alert('Failed to send message.');
        } finally {
            hideLoading();
        }
    });

    // --- EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            state.activeTab = button.dataset.tab;
            renderUI();
        });
    });
    
    searchInput.addEventListener('input', () => renderFoundItems(window.foundItemsData || []));
    categoryFilter.addEventListener('change', () => renderFoundItems(window.foundItemsData || []));

    messageList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li) {
            const message = JSON.parse(li.dataset.message);
            renderMessageDetail(message);
            document.querySelectorAll('#messageList li').forEach(item => item.classList.remove('bg-sky-50'));
            li.classList.add('bg-sky-50');
        }
    });

    if (viewReportsBtn) {
        viewReportsBtn.addEventListener('click', async () => {
            const isHidden = !lostReportsSection.classList.contains('hidden');
            if (isHidden) {
                lostReportsSection.classList.add('hidden');
                viewReportsBtn.innerHTML = '👀 View Student Reports';
            } else {
                showLoading();
                try {
                    const response = await fetch(`${API_URL}/lost-reports`);
                    const reports = await response.json();
                    renderLostItemReports(reports);
                    lostReportsSection.classList.remove('hidden');
                    viewReportsBtn.innerHTML = '🔼 Hide Student Reports';
                } catch (error) {
                    alert('Failed to fetch reports.');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    // --- INITIALIZATION ---
    renderUI();
});
