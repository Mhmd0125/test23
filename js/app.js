/**
 * نظام إدارة العمال - ملف التطبيق الرئيسي
 * يدير التنقل بين الصفحات المختلفة دون إعادة تحميل الصفحة
 */

// تهيئة التطبيق
function initApp() {
    // إضافة تأثيرات انتقالية للصفحات
    addPageTransitions();
    
    // إعداد أحداث التنقل
    setupNavigation();
    
    // تحميل الصفحة الافتراضية (العمال)
    showPageContent('workers');
    loadPageContent('workers');
    
    // تحديث العنصر النشط في القائمة
    const workersLink = document.querySelector('[data-page="workers"]');
    if (workersLink) {
        updateActiveNavItem(workersLink);
    }
}

// إضافة تأثيرات انتقالية للصفحات
function addPageTransitions() {
    const style = document.createElement('style');
    style.textContent = `
        .page-content {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .page-content.active {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

// إعداد التنقل بين الصفحات
function setupNavigation() {
    // الحصول على جميع روابط التنقل
    const navLinks = document.querySelectorAll('.sidebar-nav a, .main-nav-item a');
    
    // إضافة مستمع حدث لكل رابط
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // الحصول على اسم الصفحة من سمة البيانات
            const pageName = this.getAttribute('data-page');
            if (!pageName) return;
            
            // تحديث عنوان الصفحة
            updatePageTitle(pageName);
            
            // عرض محتوى الصفحة
            showPageContent(pageName);
            
            // تحديث العنصر النشط في القائمة
            updateActiveNavItem(this);
            
            // تحميل محتوى الصفحة
            loadPageContent(pageName);
        });
    });
}

// تحميل محتوى الصفحة
function loadPageContent(pageName) {
    // الحصول على عنصر المحتوى
    const contentElement = document.getElementById(`${pageName}Content`);
    if (!contentElement) return;
    
    // إظهار مؤشر التحميل
    contentElement.innerHTML = '<div class="loading">جاري تحميل المحتوى...</div>';
    
    try {
        // تحميل محتوى الصفحة باستخدام AJAX
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // تحليل محتوى الصفحة
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(xhr.responseText, 'text/html');
                    
                    // استخراج محتوى الصفحة
                    const mainContent = htmlDoc.querySelector('main');
                    
                    if (mainContent) {
                        // تحديث محتوى الصفحة
                        contentElement.innerHTML = mainContent.innerHTML;
                        
                        // تنفيذ سكربت الصفحة
                        executePageScript(pageName);
                    } else {
                        // إذا لم يتم العثور على محتوى الصفحة
                        handlePageLoadError(contentElement, pageName);
                    }
                } else {
                    // في حالة حدوث خطأ في تحميل الصفحة
                    handlePageLoadError(contentElement, pageName);
                }
            }
        };
        
        // فتح الاتصال وإرسال الطلب
        xhr.open('GET', `${pageName}.html`, true);
        xhr.send();
    } catch (error) {
        // في حالة حدوث خطأ غير متوقع
        console.error(`خطأ في تحميل صفحة ${pageName}:`, error);
        handlePageLoadError(contentElement, pageName);
    }
}

// معالجة خطأ تحميل الصفحة
function handlePageLoadError(contentElement, pageName) {
    // عرض محتوى الصفحة مباشرة بدلاً من رسالة الخطأ
    switch(pageName) {
        case 'dashboard':
            loadDashboardDirectly(contentElement);
            break;
        case 'contractors':
            loadContractorsDirectly(contentElement);
            break;
        case 'workers':
            loadWorkersDirectly(contentElement);
            break;
        case 'attendance':
            loadAttendanceDirectly(contentElement);
            break;
        case 'workshops':
            loadWorkshopsDirectly(contentElement);
            break;
        case 'foremen':
            loadForemenDirectly(contentElement);
            break;
        case 'reports':
            loadReportsDirectly(contentElement);
            break;
        case 'invoice':
            loadInvoiceDirectly(contentElement);
            break;
        case 'archive':
            loadArchiveDirectly(contentElement);
            break;
        case 'settings':
            loadSettingsDirectly(contentElement);
            break;
        default:
            contentElement.innerHTML = `
                <div class="error">
                    <h3>حدث خطأ أثناء تحميل الصفحة</h3>
                    <p>يرجى المحاولة مرة أخرى لاحقًا.</p>
                </div>
            `;
    }
}

// تنفيذ سكربت الصفحة
function executePageScript(pageName) {
    console.log('تنفيذ سكربت:', pageName);

    // تحميل ملف JavaScript للصفحة إذا لم يكن محملاً بالفعل
    if (!document.getElementById(`${pageName}Script`)) {
        const script = document.createElement('script');
        script.id = `${pageName}Script`;
        script.src = `js/${pageName}.js`;
        script.onload = () => {
            console.log('تم تحميل سكربت:', pageName);
        };
        script.onerror = () => {
            console.error('فشل في تحميل سكربت:', pageName);
        };
        document.body.appendChild(script);
    } else {
        console.log('السكربت محمل مسبقاً:', pageName);
    }
}

// إظهار محتوى صفحة محددة وإخفاء المحتويات الأخرى
function showPageContent(pageName) {
    // إخفاء جميع محتويات الصفحات
    const allContents = document.querySelectorAll('.page-content');
    allContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // إظهار المحتوى المطلوب بتأثير انتقالي
    const contentToShow = document.getElementById(`${pageName}Content`);
    if (contentToShow) {
        // تأخير قليل لإظهار التأثير الانتقالي
        setTimeout(() => {
            contentToShow.classList.add('active');
        }, 50);
    }
}

// تحديث عنوان الصفحة
function updatePageTitle(pageName) {
    const pageTitles = {
        'dashboard': 'لوحة التحكم',
        'contractors': 'المقاولين',
        'workers': 'العمال',
        'attendance': 'تسجيل اليوميات',
        'workshops': 'الورش',
        'foremen': 'المعلمين',
        'reports': 'التقارير',
        'invoice': 'الفواتير',
        'archive': 'الأرشيف',
        'settings': 'الإعدادات'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && pageTitles[pageName]) {
        pageTitle.textContent = pageTitles[pageName];
    }
}

// تحديث العنصر النشط في القائمة
function updateActiveNavItem(clickedLink) {
    // إزالة الفئة النشطة من جميع عناصر القائمة
    const allNavItems = document.querySelectorAll('.sidebar-nav li, .main-nav-item');
    allNavItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // إضافة الفئة النشطة للعنصر المنقور عليه
    // إذا كان الرابط داخل عنصر li
    const parentLi = clickedLink.closest('li');
    if (parentLi) {
        parentLi.classList.add('active');
    } 
    // إذا كان الرابط داخل main-nav-item
    else if (clickedLink.closest('.main-nav-item')) {
        clickedLink.closest('.main-nav-item').classList.add('active');
    }
}

// دوال تحميل محتوى الصفحات مباشرة

// تحميل صفحة لوحة التحكم مباشرة
function loadDashboardDirectly(contentElement) {
    contentElement.innerHTML = `
        <div class="dashboard-grid">
            <!-- بطاقة إحصاءات العمال -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-hard-hat"></i></div>
                <div class="stat-value" id="workersCount">جاري التحميل...</div>
                <div class="stat-title">عدد العمال</div>
            </div>

            <!-- بطاقة إحصاءات الورش -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-building"></i></div>
                <div class="stat-value" id="workshopsCount">جاري التحميل...</div>
                <div class="stat-title">عدد الورش</div>
            </div>

            <!-- بطاقة إحصاءات المقاولين -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-user-tie"></i></div>
                <div class="stat-value" id="contractorsCount">جاري التحميل...</div>
                <div class="stat-title">عدد المقاولين</div>
            </div>

            <!-- بطاقة إحصاءات المعاليم -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-user-cog"></i></div>
                <div class="stat-value" id="foremenCount">جاري التحميل...</div>
                <div class="stat-title">عدد المعاليم</div>
            </div>

            <!-- بطاقة مجموع الرواتب -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-value" id="totalSalaries">جاري التحميل...</div>
                <div class="stat-title">مجموع رواتب الشهر</div>
            </div>

            <!-- بطاقة تكاليف المعاليم -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-hand-holding-usd"></i></div>
                <div class="stat-value" id="foremenCosts">جاري التحميل...</div>
                <div class="stat-title">مجموع تكاليف المعاليم</div>
            </div>

            <!-- بطاقة أيام العمل -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calendar-day"></i></div>
                <div class="stat-value" id="workDays">جاري التحميل...</div>
                <div class="stat-title">أيام عمل العمال</div>
            </div>

            <!-- بطاقة الساعات الإضافية -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-value" id="overtimeHours">جاري التحميل...</div>
                <div class="stat-title">الساعات الإضافية</div>
            </div>

            <!-- بطاقة أكثر عامل عملاً -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                <div class="stat-value" id="topWorker">جاري التحميل...</div>
                <div class="stat-title">أكثر عامل عملاً</div>
            </div>

            <!-- بطاقة أكثر عامل ساعات إضافية -->
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-star"></i></div>
                <div class="stat-value" id="topOvertime">جاري التحميل...</div>
                <div class="stat-title">أكثر عامل ساعات إضافية</div>
            </div>
        </div>
    `;

    // تحميل وتنفيذ سكربت لوحة التحكم
    executePageScript('dashboard');

    // استدعاء وظيفة تهيئة لوحة التحكم
    setTimeout(() => {
        if (typeof initDashboardPage === 'function') {
            initDashboardPage();
        }
    }, 100);
}

// تحميل صفحة المقاولين مباشرة
function loadContractorsDirectly(contentElement) {
    console.log('تحميل صفحة المقاولين...');

    contentElement.innerHTML = `
        <header>
            <h1>إدارة المقاولين</h1>
        </header>

        <div class="contractors-layout">
            <!-- نموذج إضافة المقاول على اليمين -->
            <div class="contractor-form-section">
                <div class="card">
                    <h2>إضافة مقاول جديد</h2>
                    <div id="contractorForm">
                        <div class="form-group">
                            <label for="contractorName">اسم المقاول</label>
                            <input type="text" id="contractorName" required>
                        </div>
                        <div class="form-group">
                            <label for="contractorPhone">رقم الهاتف</label>
                            <input type="tel" id="contractorPhone">
                        </div>
                        <div class="form-group">
                            <label for="contractorAddress">العنوان</label>
                            <input type="text" id="contractorAddress">
                        </div>
                        <div class="form-group">
                            <label for="contractorNotes">ملاحظات</label>
                            <textarea id="contractorNotes" rows="3"></textarea>
                        </div>
                        <button type="button" class="btn success" onclick="saveContractorNow()">حفظ المقاول</button>
                        <button type="button" id="cancelEdit" class="btn" style="display: none;">إلغاء التعديل</button>
                    </div>
                </div>
            </div>

            <!-- جدول المقاولين على الشمال -->
            <div class="contractors-table-section">
                <div class="card">
                    <h2>قائمة المقاولين</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>رقم الهاتف</th>
                                <th>العنوان</th>
                                <th>عدد العمال</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="contractorsTableBody">
                            <!-- سيتم ملؤها بالبيانات من JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    console.log('تم إنشاء HTML للمقاولين');

    // تحميل وتنفيذ سكربت المقاولين
    executePageScript('contractors');

    // استدعاء دالة التهيئة مع تأخير أكبر
    setTimeout(() => {
        console.log('🚀 محاولة تهيئة صفحة المقاولين...');
        console.log('🔍 العناصر الموجودة:', {
            contractorForm: !!document.getElementById('contractorForm'),
            contractorsTableBody: !!document.getElementById('contractorsTableBody'),
            cancelEdit: !!document.getElementById('cancelEdit')
        });

        // تحديث الجدول مباشرة
        if (typeof window.refreshTable === 'function') {
            console.log('📊 تحديث الجدول مباشرة...');
            window.refreshTable();
        } else if (typeof window.updateContractorsTable === 'function') {
            console.log('📊 تحديث الجدول مباشرة...');
            window.updateContractorsTable();
        }

        if (typeof window.initContractorsPage === 'function') {
            window.initContractorsPage();
        } else {
            console.error('❌ دالة initContractorsPage غير موجودة');
            // محاولة تنفيذ الدالة مباشرة
            if (typeof initContractorsPage === 'function') {
                initContractorsPage();
            }
        }
    }, 1000);
}

// تحميل صفحة العمال مباشرة
function loadWorkersDirectly(contentElement) {
    contentElement.innerHTML = `
        <header>
            <h1>إدارة العمال</h1>
        </header>

        <div class="workers-layout">
            <!-- نموذج إضافة العامل على اليمين -->
            <div class="worker-form-section">
                <div class="card">
                    <h2>إضافة عامل جديد</h2>
                    <form id="workerForm">
                        <div class="form-group">
                            <label for="workerName">اسم العامل</label>
                            <input type="text" id="workerName" required>
                        </div>
                        <div class="form-group">
                            <label for="workerContractor">المقاول</label>
                            <select id="workerContractor" required>
                                <option value="">اختر المقاول</option>
                                <!-- سيتم ملؤها بالمقاولين من JavaScript -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="workerWorkshop">الورشة</label>
                            <select id="workerWorkshop">
                                <option value="">اختر الورشة</option>
                                <!-- سيتم ملؤها بالورش من JavaScript -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="workerNumber">رقم التشغيل</label>
                            <input type="text" id="workerNumber" required>
                        </div>
                        <div class="form-group">
                            <label for="dailyWage">اليومية (شيكل)</label>
                            <input type="number" id="dailyWage" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="overtimeRate">سعر الساعة الإضافية (شيكل)</label>
                            <input type="number" id="overtimeRate" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="workerImage">الصورة الشخصية</label>
                            <input type="file" id="workerImage" accept="image/*">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="workerActive" checked>
                                العامل نشط
                            </label>
                        </div>
                        <button type="submit" class="btn success">حفظ العامل</button>
                        <button type="button" id="cancelWorkerEdit" class="btn" style="display: none;">إلغاء التعديل</button>
                    </form>
                </div>
            </div>

            <!-- جدول العمال على الشمال -->
            <div class="workers-table-section">
                <div class="card">
                    <h2>قائمة العمال</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>الصورة</th>
                                <th>الاسم</th>
                                <th>المقاول</th>
                                <th>الورشة</th>
                                <th>رقم التشغيل</th>
                                <th>اليومية (شيكل)</th>
                                <th>سعر الساعة الإضافية (شيكل)</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="workersTableBody">
                            <!-- سيتم ملؤها بالبيانات من JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // تحميل وتنفيذ سكربت العمال
    executePageScript('workers');

    // استدعاء دالة التهيئة
    setTimeout(() => {
        if (typeof initWorkersPage === 'function') {
            initWorkersPage();
        }
    }, 100);
}

// تحميل صفحة تسجيل اليوميات مباشرة
function loadAttendanceDirectly(contentElement) {
    contentElement.innerHTML = `
        <header>
            <h1>تسجيل يوميات العمال</h1>
        </header>

        <div class="attendance-layout">
            <!-- نموذج تسجيل اليوميات على اليمين -->
            <div class="attendance-form-section">
                <div class="card">
                    <h2>تسجيل يومية جديدة</h2>
                    <form id="attendanceForm">
                        <div class="form-group">
                            <label for="attendanceDate">التاريخ</label>
                            <input type="date" id="attendanceDate" required>
                        </div>
                        <div class="form-group">
                            <label for="contractorSelect">المقاول</label>
                            <select id="contractorSelect" required>
                                <option value="">اختر المقاول</option>
                                <!-- سيتم ملؤها بالمقاولين من JavaScript -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="workerSelect">العامل</label>
                            <select id="workerSelect" required disabled>
                                <option value="">اختر العامل</option>
                                <!-- سيتم ملؤها بالعمال من JavaScript -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="workshopSelect">الورشة</label>
                            <select id="workshopSelect">
                                <option value="">اختر الورشة</option>
                                <!-- سيتم ملؤها بالورش من JavaScript -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="attendanceStatus">الحضور</label>
                            <select id="attendanceStatus" required>
                                <option value="present">حاضر</option>
                                <option value="absent">غائب</option>
                                <option value="late">متأخر</option>
                                <option value="excused">إجازة</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="overtimeHours">ساعات إضافية</label>
                            <input type="number" id="overtimeHours" min="0" step="0.5" value="0">
                        </div>
                        <div class="form-group">
                            <label for="advance">سلفة (شيكل)</label>
                            <input type="number" id="advance" min="0" step="0.01" value="0">
                        </div>
                        <div class="form-group">
                            <label for="smokingCost">تكلفة الدخان (شيكل)</label>
                            <input type="number" id="smokingCost" min="0" step="0.01" value="0">
                        </div>
                        <div class="form-group">
                            <label for="attendanceNotes">ملاحظات</label>
                            <textarea id="attendanceNotes" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn success">حفظ</button>
                    </form>
                </div>
            </div>

            <!-- جدول اليوميات على الشمال -->
            <div class="attendance-table-section">
                <div class="card">
                    <h2>سجلات الحضور</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>العامل</th>
                                <th>الورشة</th>
                                <th>الحضور</th>
                                <th>ساعات إضافية</th>
                                <th>سلفة</th>
                                <th>تكلفة الدخان</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="attendanceTableBody">
                            <!-- سيتم ملؤها بالبيانات من JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // تحميل وتنفيذ سكربت تسجيل اليوميات
    executePageScript('attendance');

    // استدعاء دالة التهيئة
    setTimeout(() => {
        if (typeof initAttendancePage === 'function') {
            initAttendancePage();
        }
    }, 100);
}

// تحميل صفحة الورش مباشرة
function loadWorkshopsDirectly(contentElement) {
    contentElement.innerHTML = `
        <header>
            <h1>إدارة الورش</h1>
        </header>

        <div class="workshops-layout">
            <!-- نموذج إضافة الورشة على اليمين -->
            <div class="workshop-form-section">
                <div class="card">
                    <h2>إضافة ورشة جديدة</h2>
                    <form id="workshopForm">
                        <div class="form-group">
                            <label for="workshopName">اسم الورشة</label>
                            <input type="text" id="workshopName" required>
                        </div>
                        <div class="form-group">
                            <label for="workshopLocation">الموقع</label>
                            <input type="text" id="workshopLocation">
                        </div>
                        <div class="form-group">
                            <label for="workshopManager">المسؤول</label>
                            <input type="text" id="workshopManager">
                        </div>
                        <div class="form-group">
                            <label for="workshopPhone">رقم الهاتف</label>
                            <input type="tel" id="workshopPhone">
                        </div>
                        <div class="form-group">
                            <label for="workshopNotes">ملاحظات</label>
                            <textarea id="workshopNotes" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn success">حفظ الورشة</button>
                        <button type="button" id="cancelWorkshopEdit" class="btn" style="display: none;">إلغاء التعديل</button>
                    </form>
                </div>
            </div>

            <!-- جدول الورش على الشمال -->
            <div class="workshops-table-section">
                <div class="card">
                    <h2>قائمة الورش</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>اسم الورشة</th>
                                <th>الموقع</th>
                                <th>المسؤول</th>
                                <th>رقم الهاتف</th>
                                <th>عدد العمال</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="workshopsTableBody">
                            <!-- سيتم ملؤها بالبيانات من JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // تحميل وتنفيذ سكربت الورش
    executePageScript('workshops');

    // استدعاء دالة التهيئة
    setTimeout(() => {
        if (typeof initWorkshopsPage === 'function') {
            initWorkshopsPage();
        }
    }, 100);
}

// تحميل صفحة المعاليم مباشرة
function loadForemenDirectly(contentElement) {
    contentElement.innerHTML = `
        <header>
            <h1>إدارة المعاليم</h1>
        </header>

        <div class="foremen-layout">
            <!-- نموذج إضافة المعلم على اليمين -->
            <div class="foreman-form-section">
                <div class="card">
                    <h2>إضافة معلم جديد</h2>
                    <form id="foremanForm">
                        <div class="form-group">
                            <label for="foremanName">اسم المعلم</label>
                            <input type="text" id="foremanName" required>
                        </div>
                        <div class="form-group">
                            <label for="foremanPhone">رقم الهاتف</label>
                            <input type="tel" id="foremanPhone">
                        </div>
                        <div class="form-group">
                            <label for="foremanSpecialty">التخصص</label>
                            <input type="text" id="foremanSpecialty">
                        </div>
                        <div class="form-group">
                            <label for="foremanWorkshop">الورشة</label>
                            <select id="foremanWorkshop">
                                <option value="">اختر الورشة</option>
                                <!-- سيتم ملؤها بالورش من JavaScript -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="foremanNotes">ملاحظات</label>
                            <textarea id="foremanNotes" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn success">حفظ المعلم</button>
                        <button type="button" id="cancelForemanEdit" class="btn" style="display: none;">إلغاء التعديل</button>
                    </form>
                </div>
            </div>

            <!-- جدول المعاليم على الشمال -->
            <div class="foremen-table-section">
                <div class="card">
                    <h2>قائمة المعاليم</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>رقم الهاتف</th>
                                <th>التخصص</th>
                                <th>الورشة</th>
                                <th>إجمالي التكاليف</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="foremenTableBody">
                            <!-- سيتم ملؤها بالبيانات من JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // تحميل وتنفيذ سكربت المعاليم
    executePageScript('foremen');

    // استدعاء دالة التهيئة
    setTimeout(() => {
        if (typeof initForemenPage === 'function') {
            initForemenPage();
        }
    }, 100);
}

// تحميل صفحة التقارير مباشرة
function loadReportsDirectly(contentElement) {
    contentElement.innerHTML = `
        <div class="tabs">
            <div class="tab-header">
                <div class="tab-item active" data-tab="workerReports">تقارير العمال</div>
                <div class="tab-item" data-tab="contractorReports">تقارير المقاولين</div>
                <div class="tab-item" data-tab="workshopReports">تقارير الورش</div>
                <div class="tab-item" data-tab="monthlyReports">التقارير الشهرية</div>
            </div>
            <div class="tab-content">
                <div class="tab-pane active" id="workerReports">
                    <section class="content-section">
                        <div class="card">
                            <h2>تقرير العامل</h2>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reportWorker">اختر العامل</label>
                                    <select id="reportWorker" required>
                                        <option value="">اختر العامل</option>
                                        <!-- سيتم ملؤها بالعمال من JavaScript -->
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="reportWorkerMonth">الشهر</label>
                                    <input type="month" id="reportWorkerMonth" required>
                                </div>
                                <div class="form-group">
                                    <button type="button" id="generateWorkerReport" class="btn">عرض التقرير</button>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section class="content-section" id="workerReportResult">
                        <!-- سيتم ملؤها بنتائج التقرير من JavaScript -->
                    </section>
                </div>
                <div class="tab-pane" id="contractorReports">
                    <section class="content-section">
                        <div class="card">
                            <h2>تقرير المقاول</h2>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reportContractor">اختر المقاول</label>
                                    <select id="reportContractor" required>
                                        <option value="">اختر المقاول</option>
                                        <!-- سيتم ملؤها بالمقاولين من JavaScript -->
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="reportContractorMonth">الشهر</label>
                                    <input type="month" id="reportContractorMonth" required>
                                </div>
                                <div class="form-group">
                                    <button type="button" id="generateContractorReport" class="btn">عرض التقرير</button>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section class="content-section" id="contractorReportResult">
                        <!-- سيتم ملؤها بنتائج التقرير من JavaScript -->
                    </section>
                </div>
                <div class="tab-pane" id="workshopReports">
                    <section class="content-section">
                        <div class="card">
                            <h2>تقرير الورشة</h2>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reportWorkshop">اختر الورشة</label>
                                    <select id="reportWorkshop" required>
                                        <option value="">اختر الورشة</option>
                                        <!-- سيتم ملؤها بالورش من JavaScript -->
</select>
                                </div>
                                <div class="form-group">
                                    <label for="reportWorkshopMonth">الشهر</label>
                                    <input type="month" id="reportWorkshopMonth" required>
                                </div>
                                <div class="form-group">
                                    <button type="button" id="generateWorkshopReport" class="btn">عرض التقرير</button>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section class="content-section" id="workshopReportResult">
                        <!-- سيتم ملؤها بنتائج التقرير من JavaScript -->
                    </section>
                </div>
                <div class="tab-pane" id="monthlyReports">
                    <section class="content-section">
                        <div class="card">
                            <h2>التقرير الشهري</h2>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reportMonth">الشهر</label>
                                    <input type="month" id="reportMonth" required>
                                </div>
                                <div class="form-group">
                                    <button type="button" id="generateMonthlyReport" class="btn">عرض التقرير</button>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section class="content-section" id="monthlyReportResult">
                        <!-- سيتم ملؤها بنتائج التقرير من JavaScript -->
                    </section>
                </div>
            </div>
        </div>
    `;
    
    // تحميل وتنفيذ سكربت التقارير
    executePageScript('reports');
}

// تحميل صفحة الفواتير مباشرة
function loadInvoiceDirectly(contentElement) {
    contentElement.innerHTML = `
        <section class="content-section">
            <div class="card">
                <h2>إنشاء فاتورة جديدة</h2>
                <form id="invoiceForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="invoiceDate">تاريخ الفاتورة</label>
                            <input type="date" id="invoiceDate" required>
                        </div>
                        <div class="form-group">
                            <label for="invoiceNumber">رقم الفاتورة</label>
                            <input type="text" id="invoiceNumber" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="contractorSelect">المقاول</label>
                            <select id="contractorSelect">
                                <option value="">اختر المقاول</option>
                                <!-- سيتم ملؤها بالمقاولين من JavaScript -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="workshopSelect">الورشة</label>
                            <select id="workshopSelect">
                                <option value="">اختر الورشة</option>
                                <!-- سيتم ملؤها بالورش من JavaScript -->
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="invoiceNotes">ملاحظات</label>
                        <textarea id="invoiceNotes" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn">إنشاء الفاتورة</button>
                </form>
            </div>
        </section>
        
        <section class="content-section">
            <div class="card">
                <h2>قائمة الفواتير</h2>
                <div class="filter-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="filterInvoiceDate">تصفية حسب التاريخ</label>
                            <input type="month" id="filterInvoiceDate">
                        </div>
                        <div class="form-group">
                            <label for="filterInvoiceContractor">تصفية حسب المقاول</label>
                            <select id="filterInvoiceContractor">
                                <option value="">جميع المقاولين</option>
                                <!-- سيتم ملؤها بالمقاولين من JavaScript -->
                            </select>
                        </div>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>التاريخ</th>
                            <th>المقاول</th>
                            <th>الورشة</th>
                            <th>المبلغ الإجمالي</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="invoicesTableBody">
                        <!-- سيتم ملؤها بالبيانات من JavaScript -->
                    </tbody>
                </table>
            </div>
        </section>
    `;
    
    // تحميل وتنفيذ سكربت الفواتير
    executePageScript('invoice');
}

// تحميل صفحة الأرشيف مباشرة
function loadArchiveDirectly(contentElement) {
    contentElement.innerHTML = `
        <section class="content-section">
            <div class="card">
                <h2>أرشيف البيانات</h2>
                <div class="archive-options">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="archiveType">نوع البيانات</label>
                            <select id="archiveType">
                                <option value="workers">العمال</option>
                                <option value="contractors">المقاولين</option>
                                <option value="attendance">سجلات الحضور</option>
                                <option value="invoices">الفواتير</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="archiveDate">الفترة الزمنية</label>
                            <select id="archiveDate">
                                <option value="all">جميع البيانات</option>
                                <option value="month">الشهر الحالي</option>
                                <option value="quarter">الربع الحالي</option>
                                <option value="year">السنة الحالية</option>
                                <option value="custom">فترة مخصصة</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row" id="customDateRange" style="display: none;">
                        <div class="form-group">
                            <label for="archiveStartDate">من تاريخ</label>
                            <input type="date" id="archiveStartDate">
                        </div>
                        <div class="form-group">
                            <label for="archiveEndDate">إلى تاريخ</label>
                            <input type="date" id="archiveEndDate">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="exportArchive" class="btn">تصدير البيانات</button>
                        <button type="button" id="importArchive" class="btn">استيراد البيانات</button>
                    </div>
                </div>
            </div>
        </section>
        
        <section class="content-section">
            <div class="card">
                <h2>نسخ احتياطية</h2>
                <div class="backup-options">
                    <div class="form-actions">
                        <button type="button" id="createBackup" class="btn">إنشاء نسخة احتياطية</button>
                        <button type="button" id="restoreBackup" class="btn">استعادة نسخة احتياطية</button>
                    </div>
                    <div class="backup-list">
                        <h3>النسخ الاحتياطية المتوفرة</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>الحجم</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="backupsTableBody">
                                <!-- سيتم ملؤها بالبيانات من JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    // تحميل وتنفيذ سكربت الأرشيف
    executePageScript('archive');
}

// تحميل صفحة الإعدادات مباشرة
function loadSettingsDirectly(contentElement) {
    contentElement.innerHTML = `
        <section class="content-section">
            <div class="card">
                <h2>إعدادات النظام</h2>
                <form id="settingsForm">
                    <div class="form-group">
                        <label for="companyName">اسم الشركة</label>
                        <input type="text" id="companyName">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="companyPhone">رقم الهاتف</label>
                            <input type="tel" id="companyPhone">
                        </div>
                        <div class="form-group">
                            <label for="companyEmail">البريد الإلكتروني</label>
                            <input type="email" id="companyEmail">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="companyAddress">العنوان</label>
                        <input type="text" id="companyAddress">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="currency">العملة</label>
                            <select id="currency">
                                <option value="ILS">شيكل</option>
                                <option value="JOD">دينار أردني</option>
                                <option value="USD">دولار أمريكي</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="language">اللغة</label>
                            <select id="language">
                                <option value="ar">العربية</option>
                                <option value="en">الإنجليزية</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="theme">المظهر</label>
                        <select id="theme">
                            <option value="light">فاتح</option>
                            <option value="dark">داكن</option>
                            <option value="auto">تلقائي</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">حفظ الإعدادات</button>
                </form>
            </div>
        </section>
        
        <section class="content-section">
            <div class="card">
                <h2>إعدادات المستخدم</h2>
                <form id="userSettingsForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="userName">اسم المستخدم</label>
                            <input type="text" id="userName">
                        </div>
                        <div class="form-group">
                            <label for="userEmail">البريد الإلكتروني</label>
                            <input type="email" id="userEmail">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="currentPassword">كلمة المرور الحالية</label>
                            <input type="password" id="currentPassword">
                        </div>
                        <div class="form-group">
                            <label for="newPassword">كلمة المرور الجديدة</label>
                            <input type="password" id="newPassword">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">تأكيد كلمة المرور</label>
                        <input type="password" id="confirmPassword">
                    </div>
                    <button type="submit" class="btn">تحديث بيانات المستخدم</button>
                </form>
            </div>
        </section>
    `;
    
    // تحميل وتنفيذ سكربت الإعدادات
    executePageScript('settings');
}