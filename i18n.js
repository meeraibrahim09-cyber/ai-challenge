const translations = {
  en: {
    dir: "ltr",
    nav_form: "Register",
    nav_dashboard: "Dashboard",
    lang_toggle: "العربية",
    campaign: "Summer at TEC",
    page_title: "Team Registration",
    subtitle: "Fill in your team's details below.",
    label_team_name: "Team name",
    label_total_members: "Total members",
    label_members: "Team member names",
    member_placeholder: "Member name",
    add_member: "Add member",
    remove_member: "Remove",
    label_option: "Choose option",
    option_solution: "Develop a solution using AI for the domains proposed in the Executive Council",
    option_demo: "Introduce a new AI tool for use, with a live demo",
    label_area: "Selected area",
    area_placeholder: "Choose an area",
    area_project_management: "Project Management",
    area_governance: "Governance",
    area_data_analysis: "Data Analysis",
    area_government_communication: "Government Communication",
    area_happiness_surveys: "Happiness Surveys",
    area_admin: "Admin",
    area_excellence_assessment: "Excellence Assessment",
    submit: "Submit",
    submitting: "Submitting...",
    success: "Thanks! Your team has been registered.",
    error_generic: "Something went wrong. Please try again.",
    error_network: "Network error. Please try again.",
    error_required_team_name: "Please enter your team name.",
    error_required_total_members: "Please enter the number of members.",
    error_required_members: "Please enter at least one member name.",
    error_required_option: "Please choose an option.",
    error_required_area: "Please choose an area.",
    dashboard_title: "Submitted teams",
    dashboard_subtitle: "Live list of registered teams.",
    dashboard_loading: "Loading submissions...",
    dashboard_empty: "No teams have registered yet.",
    dashboard_error: "Couldn't load submissions right now.",
    dashboard_refresh: "Refresh",
    col_team_name: "Team name",
    col_total_members: "Count",
    col_members: "Members",
    col_option: "Option",
    col_area: "Area",
    col_submitted: "Submitted",
  },
  ar: {
    dir: "rtl",
    nav_form: "التسجيل",
    nav_dashboard: "لوحة المتابعة",
    lang_toggle: "English",
    campaign: "الصيف في الأمانة",
    page_title: "تسجيل الفريق",
    subtitle: "يرجى تعبئة بيانات فريقكم أدناه.",
    label_team_name: "اسم الفريق",
    label_total_members: "إجمالي عدد الأعضاء",
    label_members: "أسماء أعضاء الفريق",
    member_placeholder: "اسم العضو",
    add_member: "إضافة عضو",
    remove_member: "إزالة",
    label_option: "اختر الخيار",
    option_solution: "ابتكار حل باستخدام الذكاء الاصطناعي للمجالات المطروحة في المجلس التنفيذي",
    option_demo: "طرح أداة جديدة في الذكاء الاصطناعي للاستخدام مع عرض توضيحي (ديمو)",
    label_area: "المجال المختار",
    area_placeholder: "اختر المجال",
    area_project_management: "إدارة المشاريع",
    area_governance: "الحوكمة",
    area_data_analysis: "تحليل البيانات",
    area_government_communication: "التواصل الحكومي",
    area_happiness_surveys: "استبيانات السعادة",
    area_admin: "الإدارة",
    area_excellence_assessment: "تقييم التميز",
    submit: "إرسال",
    submitting: "جارٍ الإرسال...",
    success: "شكراً لكم! تم تسجيل فريقكم بنجاح.",
    error_generic: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    error_network: "خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
    error_required_team_name: "يرجى إدخال اسم الفريق.",
    error_required_total_members: "يرجى إدخال عدد الأعضاء.",
    error_required_members: "يرجى إدخال اسم عضو واحد على الأقل.",
    error_required_option: "يرجى اختيار أحد الخيارات.",
    error_required_area: "يرجى اختيار المجال.",
    dashboard_title: "الفرق المسجّلة",
    dashboard_subtitle: "قائمة مباشرة بالفرق المسجّلة.",
    dashboard_loading: "جارٍ تحميل التسجيلات...",
    dashboard_empty: "لم يسجّل أي فريق بعد.",
    dashboard_error: "تعذّر تحميل التسجيلات حالياً.",
    dashboard_refresh: "تحديث",
    col_team_name: "اسم الفريق",
    col_total_members: "العدد",
    col_members: "الأعضاء",
    col_option: "الخيار",
    col_area: "المجال",
    col_submitted: "تاريخ التسجيل",
  },
};

function getLang() {
  return localStorage.getItem("lang") === "ar" ? "ar" : "en";
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  applyLang(lang);
}

function applyLang(lang) {
  const t = translations[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = t.dir;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] !== undefined) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key] !== undefined) el.setAttribute("placeholder", t[key]);
  });

  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang, t } }));
}

document.addEventListener("DOMContentLoaded", () => {
  applyLang(getLang());
  const toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      setLang(getLang() === "en" ? "ar" : "en");
    });
  }
});
