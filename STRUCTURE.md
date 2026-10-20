# 📁 CFSS Project Structure (Beginner Guide)

ဖိုင်တွဲတွေကို Beginner များ မျက်စိမရှုပ်စေရန် အရှင်းဆုံး **Flat Structure** အဖြစ် ပြင်ဆင်ထားပါသည်။

---

## 🧭 ဘယ်သူက ဘယ်ဖိုင်မှာ ရေးရမလဲ?

### 1. 🖥️ Frontend (UI စာမျက်နှာများ)
Page တစ်ခုစီအတွက် သက်ဆိုင်ရာ ဖိုင် ၁ ခုတည်းမှာ တိုက်ရိုက် ဝင်ရောက်ပြင်ဆင်နိုင်ပါသည်:

| စာမျက်နှာ (Page) | ဖိုင်တည်နေရာ (Path) | တာဝန်ယူသူ (Owner) | လုပ်ဆောင်ချက် |
| :--- | :--- | :--- | :--- |
| **Schedule Calendar** | `src/app/page.tsx` | Calendar Team | ပင်မ Calendar ဇယားကြီးနှင့် အခန်းလွတ်များ ပြသမည့်နေရာ (`/`) |
| **Booking Form & List** | `src/app/bookings/page.tsx` | Booking Team | အခန်းငှားရန် Form နှင့် မိမိငှားထားသော စာရင်းများ (`/bookings`) |
| **Admin Portal** | `src/app/admin/page.tsx` | Admin Team | Admin က Approve / Reject လုပ်မည့် နေရာ (`/admin`) |
| **Navbar & Header** | `src/components/Navbar.tsx` | UI/UX Team | အပေါ်က Menu bar လေး |
| **Main Layout** | `src/app/layout.tsx` | Lead | စာမျက်နှာအားလုံးကို ခြုံငုံထားသော Layout |

---

### 2. 🧩 UI Components (ရှင်းလင်းသော အစိတ်အပိုင်းများ)
Component များကို ရှုပ်ထွေးသော Sub-folder များ မခွဲဘဲ `src/components/` အောက်တွင် အလွယ်တကူ ထားရှိပါသည်:
* `src/components/CalendarGrid.tsx` — Calendar ဇယား component
* `src/components/BookingList.tsx` — Booking စာရင်းကတ်များ
* `src/components/BookingFormModal.tsx` — အခန်းငှားသည့် Popup Modal
* `src/components/AdminTable.tsx` — Admin စစ်ဆေးသည့် ဇယား

---

### 3. ⚙️ Backend & Server Actions (Logic ပိုင်း)
Database ထဲ Data သိမ်းခြင်း၊ ထုတ်ခြင်းများကို `src/actions/` ထဲတွင် ရေးပါသည်:
* `src/actions/bookings.ts` — Booking တင်ခြင်း၊ Double Booking စစ်ဆေးခြင်း
* `src/actions/rooms.ts` — အခန်းစာရင်းနှင့် အချက်အလက်များ ဆွဲထုတ်ခြင်း
* `src/actions/admin.ts` — Admin မှ Approve/Reject လုပ်ဆောင်ချက်များ
* `src/lib/supabase/` — Supabase database ချိတ်ဆက်မှုများ

---

### 4. 🗂️ Database Types
* `src/types/database.ts` — `Room`, `Booking`, `Profile` အစရှိသည့် Data ပုံစံများ (TypeScript)

---

## 💡 AI ကို မေးခွန်းမေးတဲ့အခါ အလွယ်ဆုံး Prompt ပုံစံ:
> *"I am working on CFSS. Please write the code for `src/components/CalendarGrid.tsx` using Next.js 15, Tailwind CSS, and Lucide icons."*
