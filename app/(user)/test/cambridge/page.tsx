import Link from "next/link";
import { BookMarked, ClipboardList, FileText } from "lucide-react";

import { Routes } from "@/app/constants/routes";

export default function CambridgeTestPage() {
  return (
    <main className="min-h-[calc(80vh-60px)] bg-[#F3F8FC] px-4 py-10">
      <section className="mx-auto max-w-5xl rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#E8F2FF] px-3 text-sm font-bold text-[#0E4BA9]">
              <BookMarked className="h-4 w-4" />
              Cambridge Test
            </div>
            <h1 className="mt-5 text-3xl font-extrabold text-[#0E4BA9]">
              Cambridge Placement Test
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Khu vực này đã được chuẩn bị sẵn để thêm bài Cambridge trong giai
              đoạn tiếp theo. Hiện tại học sinh có thể tiếp tục làm IELTS
              Placement Test như bình thường.
            </p>
          </div>

          <Link
            href={Routes.TEST_IELTS}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0E4BA9] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A3F91]"
          >
            <FileText className="h-4 w-4" />
            Go to IELTS Test
          </Link>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <InfoBlock
            title="Test bank"
            text="Sẵn sàng để thêm Starters, Movers, Flyers hoặc các bộ Cambridge khác."
          />
          <InfoBlock
            title="Result sheet"
            text="Có thể nối sang sheet riêng hoặc dùng chung dashboard quản lý sau khi cấu trúc đề hoàn tất."
          />
          <InfoBlock
            title="Office flow"
            text="Kết quả Cambridge sẽ được đưa vào header và dashboard cùng luồng tư vấn hiện tại."
          />
        </div>
      </section>
    </main>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <ClipboardList className="h-5 w-5 text-[#0E4BA9]" />
      <h2 className="mt-3 font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
