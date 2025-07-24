// تهيئة بيانات المُعلمين إذا لم تكن موجودة
if (!localStorage.getItem('foremen')) {
    localStorage.setItem('foremen', JSON.stringify([]));
}

// عناصر DOM
let foremenTableBody;
let foremanForm;
let foremanWorkshopSelect;
let cancelForemanEditBtn;

// متغيرات حالة
let currentForemanId = null;
let isEditing = false;

// تهيئة عناصر DOM عند تحميل الصفحة
function initForemenPage() {
    foremenTableBody = document.getElementById('foremenTableBody');
    foremanForm = document.getElementById('foremanForm');
    foremanWorkshopSelect = document.getElementById('foremanWorkshop');
    cancelForemanEditBtn = document.getElementById('cancelForemanEdit');

    if (foremanForm) {
        foremanForm.addEventListener('submit', handleForemanSubmit);
    }

    if (cancelForemanEditBtn) {
        cancelForemanEditBtn.addEventListener('click', cancelForemanEdit);
    }

    populateWorkshopsDropdown();
    renderForemenTable();
}

// إلغاء التعديل
function cancelForemanEdit() {
    isEditing = false;
    currentForemanId = null;
    foremanForm.reset();
    cancelForemanEditBtn.style.display = 'none';
    document.querySelector('.foreman-form-section h2').textContent = 'إضافة معلم جديد';
}

// تعبئة قائمة الورش
function populateWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];

    if (!foremanWorkshopSelect) return;

    // مسح الخيارات الحالية
    foremanWorkshopSelect.innerHTML = '<option value="">اختر الورشة</option>';

    // إضافة الورش
    workshops.forEach(workshop => {
        const option = document.createElement('option');
        option.value = workshop.id;
        option.textContent = workshop.name;
        foremanWorkshopSelect.appendChild(option);
    });
}



// معالجة حفظ المعلم
foremanForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('foremanName').value.trim();
    const phone = document.getElementById('foremanPhone').value.trim();
    const specialty = document.getElementById('foremanSpecialty').value.trim();
    const workshopId = foremanWorkshopSelect.value;
    const notes = document.getElementById('foremanNotes').value.trim();

    if (!name) {
        alert('الرجاء إدخال اسم المعلم');
        return;
    }

    // الحصول على بيانات الورشة
    let workshopName = '';
    if (workshopId) {
        const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
        const workshop = workshops.find(w => w.id == workshopId);
        workshopName = workshop ? workshop.name : '';
    }

    const foremanData = {
        name,
        phone,
        specialty,
        workshopId: workshopId ? parseInt(workshopId) : null,
        workshopName,
        notes,
        totalCosts: 0 // سيتم حسابها من التكاليف المضافة
    };

    saveForeman(foremanData);
});

// حفظ المعلم في localStorage
function saveForeman(foremanData) {
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    
    if (isEditing && currentForemanId !== null) {
        // تحديث معلم موجود
        const index = foremen.findIndex(f => f.id === currentForemanId);
        if (index !== -1) {
            // حفظ السجل التاريخي
            if (!foremen[index].history) foremen[index].history = [];
            foremen[index].history.push({
                date: new Date().toISOString(),
                costs: foremen[index].costs,
                paymentDate: foremen[index].paymentDate
            });
            
            // تحديث البيانات الحالية
            foremen[index] = { ...foremen[index], ...foremanData };
        }
    } else {
        // إضافة معلم جديد
        const newId = foremen.length > 0 ? Math.max(...foremen.map(f => f.id)) + 1 : 1;
        foremanData.id = newId;
        foremen.push(foremanData);
    }
    
    localStorage.setItem('foremen', JSON.stringify(foremen));
    foremanModal.style.display = 'none';
    renderForemenTable();
}

// عرض المعلمين في الجدول
function renderForemenTable() {
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    foremenTableBody.innerHTML = '';
    
    foremen.forEach(foreman => {
        const row = document.createElement('tr');

        // عمود اسم المعلم
        const nameCell = document.createElement('td');
        nameCell.textContent = foreman.name;

        // عمود رقم الهاتف
        const phoneCell = document.createElement('td');
        phoneCell.textContent = foreman.phone || '-';

        // عمود التخصص
        const specialtyCell = document.createElement('td');
        specialtyCell.textContent = foreman.specialty || '-';

        // عمود الورشة
        const workshopCell = document.createElement('td');
        workshopCell.textContent = foreman.workshopName || '-';

        // عمود إجمالي التكاليف
        const costsCell = document.createElement('td');
        costsCell.textContent = `${foreman.totalCosts || 0} شيكل`;

        // عمود الإجراءات
        const actionsCell = document.createElement('td');

        // زر التعديل
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.className = 'btn small';
        editBtn.onclick = () => editForeman(foreman.id);

        // زر الحذف
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'حذف';
        deleteBtn.className = 'btn small danger';
        deleteBtn.onclick = () => deleteForeman(foreman.id);

        // زر إضافة تكاليف
        const addCostsBtn = document.createElement('button');
        addCostsBtn.textContent = 'إضافة تكاليف';
        addCostsBtn.className = 'btn small success';
        addCostsBtn.onclick = () => addForemanCosts(foreman.id);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        actionsCell.appendChild(addCostsBtn);

        // إضافة الخلايا إلى الصف
        row.appendChild(nameCell);
        row.appendChild(phoneCell);
        row.appendChild(specialtyCell);
        row.appendChild(workshopCell);
        row.appendChild(costsCell);
        row.appendChild(actionsCell);

        foremenTableBody.appendChild(row);
    });
}

// تعديل معلم
function editForeman(id) {
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const foreman = foremen.find(f => f.id === id);

    if (foreman) {
        isEditing = true;
        currentForemanId = id;
        modalTitle.textContent = 'تعديل بيانات المعلم';

        document.getElementById('foremanName').value = foreman.name;
        document.getElementById('foremanPhone').value = foreman.phone || '';
        document.getElementById('foremanSpecialty').value = foreman.specialty || '';
        document.getElementById('foremanDailyWage').value = foreman.dailyWage;
        document.getElementById('foremanNotes').value = foreman.notes || '';

        foremanModal.style.display = 'block';
    }
}

// حذف معلم
function deleteForeman(id) {
    if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
        const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
        const updatedForemen = foremen.filter(f => f.id !== id);
        localStorage.setItem('foremen', JSON.stringify(updatedForemen));
        renderForemenTable();
    }
}

// إضافة تكاليف للمعلم
function addForemanCosts(foremanId) {
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const foreman = foremen.find(f => f.id === foremanId);

    if (!foreman) {
        alert('المعلم غير موجود');
        return;
    }

    // إنشاء نموذج منبثق لإضافة التكاليف
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>إضافة تكاليف للمعلم: ${foreman.name}</h2>
            <form id="costsForm">
                <div class="form-group">
                    <label for="costDescription">وصف التكلفة</label>
                    <input type="text" id="costDescription" required>
                </div>
                <div class="form-group">
                    <label for="costWorkshop">الورشة</label>
                    <select id="costWorkshop">
                        <option value="">اختر الورشة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="costAmount">المبلغ (شيكل)</label>
                    <input type="number" id="costAmount" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="costDate">التاريخ</label>
                    <input type="date" id="costDate" required>
                </div>
                <div class="form-group">
                    <label for="costNotes">ملاحظات</label>
                    <textarea id="costNotes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn success">حفظ التكلفة</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // تعبئة قائمة الورش
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const workshopSelect = modal.querySelector('#costWorkshop');
    workshops.forEach(workshop => {
        const option = document.createElement('option');
        option.value = workshop.id;
        option.textContent = workshop.name;
        workshopSelect.appendChild(option);
    });

    // تعيين التاريخ الحالي
    modal.querySelector('#costDate').valueAsDate = new Date();

    // معالجة إغلاق النموذج
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // معالجة حفظ التكلفة
    const costsForm = modal.querySelector('#costsForm');
    costsForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const description = modal.querySelector('#costDescription').value.trim();
        const workshopId = modal.querySelector('#costWorkshop').value;
        const amount = parseFloat(modal.querySelector('#costAmount').value);
        const date = modal.querySelector('#costDate').value;
        const notes = modal.querySelector('#costNotes').value.trim();

        if (!description || !amount || !date) {
            alert('الرجاء ملء الحقول المطلوبة');
            return;
        }

        // الحصول على اسم الورشة
        let workshopName = '';
        if (workshopId) {
            const workshop = workshops.find(w => w.id == workshopId);
            workshopName = workshop ? workshop.name : '';
        }

        // إضافة التكلفة
        const costs = JSON.parse(localStorage.getItem('foremanCosts')) || [];
        const newCost = {
            id: costs.length > 0 ? Math.max(...costs.map(c => c.id)) + 1 : 1,
            foremanId: foremanId,
            foremanName: foreman.name,
            description,
            workshopId: workshopId ? parseInt(workshopId) : null,
            workshopName,
            amount,
            date,
            notes,
            timestamp: new Date().toISOString()
        };

        costs.push(newCost);
        localStorage.setItem('foremanCosts', JSON.stringify(costs));

        // تحديث إجمالي تكاليف المعلم
        const foremanCosts = costs.filter(c => c.foremanId === foremanId);
        const totalCosts = foremanCosts.reduce((sum, cost) => sum + cost.amount, 0);

        foreman.totalCosts = totalCosts;
        localStorage.setItem('foremen', JSON.stringify(foremen));

        // إغلاق النموذج وتحديث الجدول
        document.body.removeChild(modal);
        renderForemenTable();

        alert('تم حفظ التكلفة بنجاح');
    });
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initForemenPage();
});

// تصدير الدالة للاستخدام من app.js
window.initForemenPage = initForemenPage;