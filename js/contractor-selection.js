// التحقق من تسجيل الدخول
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    // عرض اسم المستخدم
    const user = JSON.parse(currentUser);
    document.getElementById('currentUserName').textContent = `مرحباً، ${user.username}`;
    return true;
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('selectedContractor');
        window.location.href = 'login.html';
    }
}

// تحميل وعرض المقاولين
function loadContractors() {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const contractorsGrid = document.getElementById('contractorsGrid');
    
    contractorsGrid.innerHTML = '';
    
    // بطاقة إضافة مقاول جديد
    const addCard = document.createElement('div');
    addCard.className = 'contractor-card add-contractor-card';
    addCard.innerHTML = `
        <div class="card-content">
            <div class="add-icon">
                <i class="fas fa-plus"></i>
            </div>
            <h3>إضافة مقاول جديد</h3>
            <p>اضغط هنا لإضافة مقاول جديد للنظام</p>
        </div>
    `;
    addCard.addEventListener('click', openAddContractorModal);
    contractorsGrid.appendChild(addCard);
    
    // بطاقات المقاولين الموجودين
    contractors.forEach(contractor => {
        const contractorWorkers = workers.filter(w => w.contractorId === contractor.id);
        const card = document.createElement('div');
        card.className = 'contractor-card';
        card.innerHTML = `
            <div class="card-content">
                <div class="contractor-avatar">
                    <i class="fas fa-user-tie"></i>
                </div>
                <h3>${contractor.name}</h3>
                <div class="contractor-info">
                    <p><i class="fas fa-phone"></i> ${contractor.phone || 'غير محدد'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${contractor.address || 'غير محدد'}</p>
                    <p><i class="fas fa-users"></i> ${contractorWorkers.length} عامل</p>
                </div>
                <div class="card-actions">
                    <button class="btn success" onclick="selectContractor(${contractor.id})">
                        <i class="fas fa-arrow-left"></i> اختيار
                    </button>
                    <button class="btn small danger" onclick="deleteContractorFromSelection(${contractor.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
        contractorsGrid.appendChild(card);
    });
    
    // إذا لم يكن هناك مقاولين
    if (contractors.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerHTML = `
            <div class="empty-content">
                <i class="fas fa-users"></i>
                <h3>لا توجد مقاولين مضافين</h3>
                <p>ابدأ بإضافة مقاول جديد للنظام</p>
            </div>
        `;
        contractorsGrid.appendChild(emptyMessage);
    }
}

// فتح نموذج إضافة مقاول
function openAddContractorModal() {
    document.getElementById('addContractorModal').style.display = 'block';
    document.getElementById('contractorName').focus();
}

// إغلاق نموذج إضافة مقاول
function closeAddContractorModal() {
    document.getElementById('addContractorModal').style.display = 'none';
    document.getElementById('addContractorForm').reset();
}

// معالجة إضافة مقاول جديد
document.getElementById('addContractorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('contractorName').value.trim();
    const phone = document.getElementById('contractorPhone').value.trim();
    const address = document.getElementById('contractorAddress').value.trim();
    const notes = document.getElementById('contractorNotes').value.trim();
    
    if (!name) {
        alert('الرجاء إدخال اسم المقاول');
        return;
    }
    
    // حفظ المقاول الجديد
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const newId = contractors.length > 0 ? Math.max(...contractors.map(c => c.id)) + 1 : 1;
    
    const newContractor = {
        id: newId,
        name,
        phone,
        address,
        notes,
        createdAt: new Date().toISOString()
    };
    
    contractors.push(newContractor);
    localStorage.setItem('contractors', JSON.stringify(contractors));
    
    // إغلاق النموذج وإعادة تحميل القائمة
    closeAddContractorModal();
    loadContractors();
    
    alert('تم إضافة المقاول بنجاح!');
});

// اختيار مقاول والانتقال للوحة التحكم
function selectContractor(contractorId) {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractor = contractors.find(c => c.id === contractorId);
    
    if (contractor) {
        // حفظ المقاول المختار
        localStorage.setItem('selectedContractor', JSON.stringify(contractor));
        
        // الانتقال للوحة التحكم الخاصة بالمقاول
        window.location.href = `contractor-dashboard.html?id=${contractorId}`;
    }
}

// تعديل مقاول
function editContractor(contractorId) {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractor = contractors.find(c => c.id === contractorId);
    
    if (contractor) {
        // ملء النموذج ببيانات المقاول
        document.getElementById('contractorName').value = contractor.name;
        document.getElementById('contractorPhone').value = contractor.phone || '';
        document.getElementById('contractorAddress').value = contractor.address || '';
        document.getElementById('contractorNotes').value = contractor.notes || '';
        
        // فتح النموذج
        openAddContractorModal();
        
        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addContractorForm');
        form.setAttribute('data-editing', contractorId);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث المقاول';
    }
}

// إغلاق النموذج عند النقر خارجه
window.addEventListener('click', function(e) {
    const modal = document.getElementById('addContractorModal');
    if (e.target === modal) {
        closeAddContractorModal();
    }
});

// حذف مقاول من صفحة الاختيار
function deleteContractorFromSelection(contractorId) {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractor = contractors.find(c => c.id === contractorId);

    if (!contractor) {
        alert('المقاول غير موجود!');
        return;
    }

    const confirmMessage = `هل أنت متأكد من حذف المقاول "${contractor.name}"؟\n\nتحذير: سيتم حذف جميع البيانات المرتبطة بهذا المقاول:\n- العمال\n- سجلات الحضور\n- الورش\n- مقاولي الباطن\n- التكاليف الإضافية\n\nهذا الإجراء لا يمكن التراجع عنه!`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // تأكيد إضافي
    const finalConfirm = prompt('للتأكيد، اكتب "حذف" لحذف المقاول نهائياً:');
    if (finalConfirm !== 'حذف') {
        alert('تم إلغاء عملية الحذف.');
        return;
    }

    // حذف جميع البيانات المرتبطة بالمقاول

    // حذف المقاول
    let contractorsData = JSON.parse(localStorage.getItem('contractors')) || [];
    contractorsData = contractorsData.filter(c => c.id !== contractorId);
    localStorage.setItem('contractors', JSON.stringify(contractorsData));

    // حذف العمال
    let workers = JSON.parse(localStorage.getItem('workers')) || [];
    workers = workers.filter(w => w.contractorId !== contractorId);
    localStorage.setItem('workers', JSON.stringify(workers));

    // حذف سجلات الحضور
    let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    attendance = attendance.filter(a => a.contractorId !== contractorId);
    localStorage.setItem('attendance', JSON.stringify(attendance));

    // حذف الورش
    let workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    workshops = workshops.filter(w => w.contractorId !== contractorId);
    localStorage.setItem('workshops', JSON.stringify(workshops));

    // حذف مقاولي الباطن
    let subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    subcontractors = subcontractors.filter(s => s.contractorId !== contractorId);
    localStorage.setItem('subcontractors', JSON.stringify(subcontractors));

    // حذف التكاليف الإضافية
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses = expenses.filter(e => e.contractorId !== contractorId);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // إعادة تحميل قائمة المقاولين
    loadContractors();

    alert('تم حذف المقاول وجميع البيانات المرتبطة به بنجاح!');
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        loadContractors();
    }
});
