// تهيئة بيانات المقاولين إذا لم تكن موجودة
if (!localStorage.getItem('contractors')) {
    localStorage.setItem('contractors', JSON.stringify([]));
}

// عناصر DOM
let contractorsTableBody;
let contractorForm;
let cancelEditBtn;

// متغيرات حالة
let currentContractorId = null;
let isEditing = false;

// تهيئة عناصر DOM عند تحميل الصفحة
function initContractorsPage() {
    console.log('تهيئة صفحة المقاولين...');

    // محاولة العثور على العناصر مع إعادة المحاولة
    let attempts = 0;
    const maxAttempts = 10;

    function tryInitialize() {
        attempts++;
        console.log(`محاولة رقم ${attempts} للعثور على العناصر...`);

        contractorsTableBody = document.getElementById('contractorsTableBody');
        contractorForm = document.getElementById('contractorForm');
        cancelEditBtn = document.getElementById('cancelEdit');

        console.log('عناصر DOM:', {
            contractorsTableBody: !!contractorsTableBody,
            contractorForm: !!contractorForm,
            cancelEditBtn: !!cancelEditBtn
        });

        if (contractorForm && contractorsTableBody) {
            // تم العثور على العناصر المطلوبة
            contractorForm.addEventListener('submit', handleContractorSubmit);
            console.log('تم ربط النموذج بالدالة');

            if (cancelEditBtn) {
                cancelEditBtn.addEventListener('click', cancelEdit);
            }

            renderContractorsTable();
            console.log('تم تهيئة صفحة المقاولين بنجاح');
            return true;
        } else if (attempts < maxAttempts) {
            // إعادة المحاولة بعد تأخير قصير
            setTimeout(tryInitialize, 200);
            return false;
        } else {
            console.error('فشل في العثور على عناصر DOM بعد', maxAttempts, 'محاولات');
            return false;
        }
    }

    tryInitialize();
}

// إلغاء التعديل
function cancelEdit() {
    isEditing = false;
    currentContractorId = null;
    contractorForm.reset();
    cancelEditBtn.style.display = 'none';
    document.querySelector('.contractor-form-section h2').textContent = 'إضافة مقاول جديد';
}

// معالجة حفظ المقاول
function handleContractorSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('تم الضغط على حفظ المقاول');

    const name = document.getElementById('contractorName').value.trim();
    const phone = document.getElementById('contractorPhone').value.trim();
    const address = document.getElementById('contractorAddress').value.trim();
    const notes = document.getElementById('contractorNotes').value.trim();

    console.log('بيانات المقاول:', { name, phone, address, notes });

    if (!name) {
        alert('الرجاء إدخال اسم المقاول');
        return false;
    }

    saveContractor({ name, phone, address, notes });
    return false;
}

// حفظ المقاول في localStorage
function saveContractor(contractorData) {
    console.log('حفظ المقاول:', contractorData);

    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];

    if (isEditing && currentContractorId !== null) {
        // تحديث مقاول موجود
        const index = contractors.findIndex(c => c.id === currentContractorId);
        if (index !== -1) {
            contractors[index] = { ...contractors[index], ...contractorData };
            console.log('تم تحديث المقاول');
        }
    } else {
        // إضافة مقاول جديد
        const newId = contractors.length > 0 ? Math.max(...contractors.map(c => c.id)) + 1 : 1;
        contractorData.id = newId;
        contractorData.workers = [];
        contractors.push(contractorData);
        console.log('تم إضافة مقاول جديد بالرقم:', newId);
    }

    localStorage.setItem('contractors', JSON.stringify(contractors));
    console.log('تم حفظ البيانات في localStorage');

    // إعادة تعيين النموذج
    if (contractorForm) {
        contractorForm.reset();
    }
    cancelEdit();
    renderContractorsTable();

    // عرض رسالة نجاح
    alert(isEditing ? 'تم تحديث المقاول بنجاح!' : 'تم إضافة المقاول بنجاح!');
}

// عرض المقاولين في الجدول
function renderContractorsTable() {
    console.log('عرض جدول المقاولين...');

    if (!contractorsTableBody) {
        console.error('جدول المقاولين غير موجود');
        return;
    }

    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const workers = JSON.parse(localStorage.getItem('workers')) || [];

    console.log('عدد المقاولين:', contractors.length);

    contractorsTableBody.innerHTML = '';

    if (contractors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center; color: #666;">لا توجد مقاولين مضافين</td>';
        contractorsTableBody.appendChild(row);
        return;
    }

    contractors.forEach(contractor => {
        const row = document.createElement('tr');

        // اسم المقاول
        const nameCell = document.createElement('td');
        nameCell.textContent = contractor.name;

        // رقم الهاتف
        const phoneCell = document.createElement('td');
        phoneCell.textContent = contractor.phone || '-';

        // العنوان
        const addressCell = document.createElement('td');
        addressCell.textContent = contractor.address || '-';

        // عدد العمال
        const workersCell = document.createElement('td');
        const contractorWorkers = workers.filter(worker => worker.contractorId == contractor.id);
        workersCell.textContent = contractorWorkers.length;

        // الإجراءات
        const actionsCell = document.createElement('td');

        // زر التعديل
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.className = 'btn small';
        editBtn.onclick = () => editContractor(contractor.id);

        // زر الحذف
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'حذف';
        deleteBtn.className = 'btn small danger';
        deleteBtn.onclick = () => deleteContractor(contractor.id);

        // زر إدارة العمال
        const workersBtn = document.createElement('button');
        workersBtn.textContent = 'إدارة العمال';
        workersBtn.className = 'btn small success';
        workersBtn.onclick = () => manageWorkers(contractor.id);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        actionsCell.appendChild(workersBtn);

        row.appendChild(nameCell);
        row.appendChild(phoneCell);
        row.appendChild(addressCell);
        row.appendChild(workersCell);
        row.appendChild(actionsCell);

        contractorsTableBody.appendChild(row);
    });
}

// تعديل مقاول
function editContractor(id) {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractor = contractors.find(c => c.id === id);

    if (contractor) {
        isEditing = true;
        currentContractorId = id;

        document.getElementById('contractorName').value = contractor.name;
        document.getElementById('contractorPhone').value = contractor.phone || '';
        document.getElementById('contractorAddress').value = contractor.address || '';
        document.getElementById('contractorNotes').value = contractor.notes || '';

        // تغيير عنوان النموذج
        document.querySelector('.contractor-form-section h2').textContent = 'تعديل بيانات المقاول';
        cancelEditBtn.style.display = 'inline-block';
    }
}

// حذف مقاول
function deleteContractor(id) {
    if (confirm('هل أنت متأكد من حذف هذا المقاول؟ سيتم حذف جميع العمال المرتبطين به.')) {
        let contractors = JSON.parse(localStorage.getItem('contractors')) || [];
        contractors = contractors.filter(c => c.id !== id);
        localStorage.setItem('contractors', JSON.stringify(contractors));
        renderContractorsTable();
    }
}

// إدارة عمال المقاول
function manageWorkers(contractorId) {
    // حفظ معرف المقاول الحالي في localStorage للوصول إليه في صفحة العمال
    localStorage.setItem('currentContractorId', contractorId);
    window.location.href = 'workers.html';
}

// دالة معالجة النموذج من الـ onclick
function handleContractorFormSubmit(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log('🔥 تم استدعاء handleContractorFormSubmit');

    const nameInput = document.getElementById('contractorName');
    const phoneInput = document.getElementById('contractorPhone');
    const addressInput = document.getElementById('contractorAddress');
    const notesInput = document.getElementById('contractorNotes');

    if (!nameInput) {
        console.error('❌ لم يتم العثور على حقل الاسم');
        alert('خطأ: لم يتم العثور على حقل الاسم');
        return false;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    console.log('📝 بيانات المقاول:', { name, phone, address, notes });

    if (!name) {
        alert('الرجاء إدخال اسم المقاول');
        nameInput.focus();
        return false;
    }

    try {
        const contractors = JSON.parse(localStorage.getItem('contractors')) || [];

        if (isEditing && currentContractorId) {
            // تحديث مقاول موجود
            const contractorIndex = contractors.findIndex(c => c.id === currentContractorId);

            if (contractorIndex !== -1) {
                contractors[contractorIndex] = {
                    ...contractors[contractorIndex],
                    name,
                    phone,
                    address,
                    notes,
                    updatedAt: new Date().toISOString()
                };

                localStorage.setItem('contractors', JSON.stringify(contractors));

                console.log('✅ تم تحديث المقاول:', contractors[contractorIndex]);

                // إعادة تعيين وضع التعديل
                isEditing = false;
                currentContractorId = null;

                // إخفاء زر الإلغاء
                const cancelBtn = document.getElementById('cancelEdit');
                if (cancelBtn) {
                    cancelBtn.style.display = 'none';
                }

                // إعادة تعيين عنوان النموذج
                const formTitle = document.querySelector('.contractor-form-section h2');
                if (formTitle) {
                    formTitle.textContent = 'إضافة مقاول جديد';
                }

                alert('✅ تم تحديث بيانات المقاول بنجاح!');
            }
        } else {
            // إضافة مقاول جديد
            const newId = contractors.length > 0 ? Math.max(...contractors.map(c => c.id)) + 1 : 1;

            const contractorData = {
                id: newId,
                name,
                phone,
                address,
                notes,
                workers: [],
                createdAt: new Date().toISOString()
            };

            contractors.push(contractorData);
            localStorage.setItem('contractors', JSON.stringify(contractors));

            console.log('✅ تم حفظ المقاول:', contractorData);

            alert('✅ تم إضافة المقاول بنجاح!');
        }

        console.log('📊 إجمالي المقاولين:', contractors.length);

        // مسح النموذج
        const form = document.getElementById('contractorForm');
        if (form) {
            form.reset();
            console.log('🧹 تم مسح النموذج');
        }

        // تحديث الجدول
        console.log('🔄 تحديث الجدول...');
        updateContractorsTable();

    } catch (error) {
        console.error('❌ خطأ في حفظ المقاول:', error);
        alert('حدث خطأ أثناء حفظ المقاول');
    }

    return false;
}

// دالة تحديث الجدول مبسطة
function updateContractorsTable() {
    console.log('🔄 بدء تحديث جدول المقاولين...');

    const tableBody = document.getElementById('contractorsTableBody');
    if (!tableBody) {
        console.error('❌ جدول المقاولين غير موجود');

        // محاولة العثور على الجدول بطريقة أخرى
        const allTables = document.querySelectorAll('tbody');
        console.log('📋 عدد الجداول الموجودة:', allTables.length);
        allTables.forEach((table, index) => {
            console.log(`جدول ${index}:`, table.id);
        });

        return;
    }

    console.log('✅ تم العثور على جدول المقاولين');

    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const workers = JSON.parse(localStorage.getItem('workers')) || [];

    console.log('📊 عدد المقاولين في localStorage:', contractors.length);

    // مسح الجدول الحالي
    tableBody.innerHTML = '';

    if (contractors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center; color: #666; padding: 20px;">لا توجد مقاولين مضافين</td>';
        tableBody.appendChild(row);
        console.log('📝 تم عرض رسالة "لا توجد مقاولين"');
        return;
    }

    contractors.forEach((contractor, index) => {
        console.log(`➕ إضافة المقاول ${index + 1}:`, contractor.name);

        const row = document.createElement('tr');

        // عدد العمال للمقاول
        const contractorWorkers = workers.filter(worker => worker.contractorId == contractor.id);

        row.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${contractor.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${contractor.phone || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${contractor.address || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${contractorWorkers.length}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                <button class="btn small" onclick="editContractor(${contractor.id})" style="margin-left: 5px;">تعديل</button>
                <button class="btn small danger" onclick="deleteContractor(${contractor.id})">حذف</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    console.log('✅ تم تحديث جدول المقاولين بنجاح - عدد المقاولين:', contractors.length);
}

// دالة تعديل المقاول مبسطة
function editContractor(id) {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractor = contractors.find(c => c.id === id);

    if (contractor) {
        document.getElementById('contractorName').value = contractor.name;
        document.getElementById('contractorPhone').value = contractor.phone || '';
        document.getElementById('contractorAddress').value = contractor.address || '';
        document.getElementById('contractorNotes').value = contractor.notes || '';

        // تغيير النموذج لوضع التعديل
        isEditing = true;
        currentContractorId = id;

        const cancelBtn = document.getElementById('cancelEdit');
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
        }

        const formTitle = document.querySelector('.contractor-form-section h2');
        if (formTitle) {
            formTitle.textContent = 'تعديل بيانات المقاول';
        }
    }
}

// إلغاء التعديل
function cancelEdit() {
    isEditing = false;
    currentContractorId = null;

    // مسح النموذج
    const form = document.getElementById('contractorForm');
    if (form) {
        form.reset();
    }

    // إخفاء زر الإلغاء
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }

    // إعادة تعيين عنوان النموذج
    const formTitle = document.querySelector('.contractor-form-section h2');
    if (formTitle) {
        formTitle.textContent = 'إضافة مقاول جديد';
    }
}

// دالة حذف المقاول مبسطة
function deleteContractor(id) {
    if (confirm('هل أنت متأكد من حذف هذا المقاول؟')) {
        let contractors = JSON.parse(localStorage.getItem('contractors')) || [];
        contractors = contractors.filter(c => c.id !== id);
        localStorage.setItem('contractors', JSON.stringify(contractors));
        updateContractorsTable();
        alert('تم حذف المقاول بنجاح!');
    }
}

// تصدير الدالة للاستخدام من app.js
window.initContractorsPage = initContractorsPage;
window.handleContractorFormSubmit = handleContractorFormSubmit;
window.editContractor = editContractor;
window.cancelEdit = cancelEdit;
window.deleteContractor = deleteContractor;
window.updateContractorsTable = updateContractorsTable;

// دالة حفظ مبسطة جداً
function saveContractorNow() {
    console.log('🚀 دالة الحفظ المبسطة');

    const name = document.getElementById('contractorName').value.trim();
    const phone = document.getElementById('contractorPhone').value.trim();
    const address = document.getElementById('contractorAddress').value.trim();
    const notes = document.getElementById('contractorNotes').value.trim();

    if (!name) {
        alert('الرجاء إدخال اسم المقاول');
        return;
    }

    // حفظ في localStorage
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const newId = Date.now(); // استخدام timestamp كـ ID

    contractors.push({
        id: newId,
        name: name,
        phone: phone,
        address: address,
        notes: notes,
        workers: []
    });

    localStorage.setItem('contractors', JSON.stringify(contractors));

    // مسح النموذج
    document.getElementById('contractorName').value = '';
    document.getElementById('contractorPhone').value = '';
    document.getElementById('contractorAddress').value = '';
    document.getElementById('contractorNotes').value = '';

    // تحديث الجدول
    refreshTable();

    alert('تم إضافة المقاول بنجاح!');
}

// دالة تحديث الجدول مبسطة
function refreshTable() {
    const tbody = document.getElementById('contractorsTableBody');
    if (!tbody) return;

    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];

    tbody.innerHTML = '';

    contractors.forEach(contractor => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${contractor.name}</td>
            <td>${contractor.phone || '-'}</td>
            <td>${contractor.address || '-'}</td>
            <td>0</td>
            <td>
                <button class="btn small">تعديل</button>
                <button class="btn small danger">حذف</button>
            </td>
        `;
    });
}

// تصدير الدالة الجديدة
window.saveContractorNow = saveContractorNow;
window.refreshTable = refreshTable;

// تأكيد التصدير
console.log('📤 تم تصدير دوال المقاولين:', {
    initContractorsPage: typeof window.initContractorsPage,
    handleContractorFormSubmit: typeof window.handleContractorFormSubmit,
    updateContractorsTable: typeof window.updateContractorsTable,
    saveContractorNow: typeof window.saveContractorNow,
    refreshTable: typeof window.refreshTable
});

// معالج إضافي للنموذج
function setupFormHandler() {
    const form = document.getElementById('contractorForm');
    if (form && !form.hasAttribute('data-handler-attached')) {
        form.addEventListener('submit', handleContractorSubmit);
        form.setAttribute('data-handler-attached', 'true');
        console.log('تم ربط معالج النموذج');
    }
}

// مراقب للتغييرات في DOM
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            setupFormHandler();
        }
    });
});

// بدء مراقبة التغييرات
if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM محمل - تهيئة صفحة المقاولين');
    initContractorsPage();
    setupFormHandler();
});

// تصدير إضافي للتأكد
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initContractorsPage };
}