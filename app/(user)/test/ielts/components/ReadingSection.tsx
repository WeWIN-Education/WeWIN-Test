"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ⭐ IMPORT Notification + Hook
import Notification from "@/app/components/notification";
import { useNotification } from "@/app/utils/useNotification";
import { TABLE_ROWS, TF_QUESTIONS } from "@/app/constants/reading";

interface ReadingSectionProps {
  onNext?: () => void;
}

export default function ReadingSection({ onNext }: ReadingSectionProps) {
  // ⭐ Hook notification
  const { notify, visible, message, type, close } = useNotification();

  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  let readingCounter = 1;

  const handleChange = (id: number, value: string) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    // const empty = Object.keys(answers).length < 4;
    // if (empty)
    //   return notify("⚠️ Vui lòng điền tất cả các câu trả lời!", "error");

    localStorage.setItem("ielts_reading", JSON.stringify(answers));
    notify("✅ Bài Reading đã được lưu!", "success");

    setTimeout(() => {
      if (onNext) onNext(); // chuyển sang Writing
    }, 600);
  };

  const renderTextWithInput = (text: string) => {
    if (!text.includes("__________")) {
      return <span className="wrap-break-word">{text}</span>;
    }

    const parts = text.split("__________");
    const qNumber = readingCounter++;

    // ✅ Tách từ cuối ra để dính với input
    const beforeWords = parts[0].trim().split(" ");
    const lastWord = beforeWords.pop(); // từ ngay trước blank
    const beforeText = beforeWords.join(" ");

    return (
      <span className="flex flex-wrap items-center leading-7 gap-1 wrap-break-word">
        {/* Text trước (trừ từ cuối) */}
        {beforeText && <span className="wrap-break-word">{beforeText}</span>}

        {/* ✅ TỪ CUỐI + INPUT BỊ KHÓA CỨNG */}
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span>{lastWord}</span>

          <input
            type="text"
            value={answers[qNumber] || ""}
            onChange={(e) => handleChange(qNumber, e.target.value)}
            placeholder={`(${qNumber})`}
            className="
            w-28 sm:w-32
            bg-transparent
            border-0 border-b-2
            border-[#2563EB]
            focus:border-[#1D4ED8]
            outline-none
            text-center
            font-semibold
            text-[#1D4ED8]
            placeholder:text-gray-400
            pb-0.5
          "
          />
        </span>

        {/* Text sau */}
        <span className="wrap-break-word">{parts[1]}</span>
      </span>
    );
  };

  return (
    <>
      {/* ⭐ GLOBAL Notification */}
      <Notification
        visible={visible}
        message={message}
        type={type}
        onClose={close}
      />

      <div className="min-h-screen bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend] px-4 py-10">
        <h1 className="text-4xl font-bold text-[#0E4BA9] mb-6 text-center">
          📖 IELTS Reading Test
        </h1>

        {/* Passage */}
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-lg p-8 mb-8 text-justify leading-relaxed text-gray-800">
          <div className="text-2xl font-semibold text-[#0E4BA9] mb-2">
            Case Study: Tourism New Zealand website
          </div>
          <p className="mb-2">
            New Zealand is a small country of four million inhabitants, a
            long-haul flight from all the major tourist-generating markets of
            the world. Tourism currently makes up 9% of the country’s gross
            domestic product, and is the country’s largest export sector. Unlike
            other export sectors, which make products and then sell them
            overseas, tourism brings its customers to New Zealand. The product
            is the country itself – the people, the places and the experiences.
            In 1999, Tourism New Zealand launched a campaign to communicate a
            new brand position to the world. The campaign focused on New
            Zealand’s scenic beauty, exhilarating outdoor activities and
            authentic Maori culture, and it made New Zealand one of the
            strongest national brands in the world.
          </p>
          <p className="mb-2">
            A key feature of the campaign was the website www.newzealand.com,
            which provided potential visitors to New Zealand with a single
            gateway to everything the destination had to offer. The heart of the
            website was a database of tourism services operators, both those
            based in New Zealand and those based abroad which offered tourism
            service to the country. Any tourism-related business could be listed
            by filling in a simple form. This meant that even the smallest bed
            and breakfast address or specialist activity provider could gain a
            web presence with access to an audience of long-haul visitors. In
            addition, because participating businesses were able to update the
            details they gave on a regular basis, the information provided
            remained accurate. And to maintain and improve standards, Tourism
            New Zealand organised a scheme whereby organisations appearing on
            the website underwent an independent evaluation against a set of
            agreed national standards of quality. As part of this, the effect of
            each business on the environment was considered.
          </p>
          <p className="mb-2">
            To communicate the New Zealand experience, the site also carried
            features relating to famous people and places. One of the most
            popular was an interview with former New Zealand All Blacks rugby
            captain Tana Umaga. Another feature that attracted a lot of
            attention was an interactive journey through a number of the
            locations chosen for blockbuster films which had made use of New
            Zealand’s stunning scenery as a backdrop. As the site developed,
            additional features were added to help independent travelers devise
            their own customised itineraries. To make it easier to plan motoring
            holidays, the site catalogued the most popular driving routes in the
            country, highlighting different routes according to the season and
            indicating distances and times.
          </p>
          <p className="mb-2">
            Later, a Travel Planner feature was added, which allowed visitors to
            click and ‘bookmark’ places or attractions they were interested in,
            and then view the results on a map. The Travel Planner offered
            suggested routes and public transport options between the chosen
            locations. There were also links to accommodation in the area. By
            registering with the website, users could save their Travel Plan and
            return to it later, or print it out to take on the visit. The
            website also had a ‘Your Words’ section where anyone could submit a
            blog of their New Zealand travels for possible inclusion on the
            website.
          </p>
        </div>

        {/* Questions Section */}
        <div className="max-w-7xl mx-auto border-black mb-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-2">Questions 1-7</h2>
            <p className="text-sm text-gray-700 leading-6">
              Complete the table below.
              <br />
              Choose <span className="font-bold">ONE WORD ONLY</span> from the
              passage for each answer.
            </p>
          </div>

          <p className="mb-6 text-black">
            Write your answers in boxes 1-7 on your answer sheet.
          </p>

          {/* Table */}
          <div className="border-2 border-black">
            {/* Header */}
            <div className="grid grid-cols-2 border-b-2 border-black bg-gray-100">
              <div className="p-4 border-r-2 border-black font-bold text-black">
                Section of website
              </div>
              <div className="p-4 font-bold text-black">Comments</div>
            </div>

            {/* Rows */}
            {TABLE_ROWS.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-2 border-b-2 border-black last:border-b-0"
              >
                {/* Left column */}
                <div className="p-4 border-r-2 border-black font-semibold text-black bg-gray-50">
                  {row.section}
                </div>

                {/* Right column */}
                <div className="p-4 space-y-3 text-gray-900 bg-white">
                  {row.items.map((text, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <div className="flex-1">{renderTextWithInput(text)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* QUESTIONS 8–13 : TRUE / FALSE / NOT GIVEN */}
        {/* ======================================================== */}
        <div className="max-w-7xl mx-auto bg-white mt-10 p-8 rounded-3xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-black mb-3">Questions 8–13</h2>

          <p className="text-sm text-gray-700 leading-6 mb-6">
            Do the following statements agree with the information given in
            Reading Passage 1?
            <br />
            In boxes <span className="font-bold">8–13</span> on your answer
            sheet, write:
          </p>

          <ul className="text-sm leading-6 mb-6 space-y-1 text-black">
            <li>
              <span className="inline-block w-24 font-bold text-green-700">
                TRUE
              </span>
              if the statement agrees with the information
            </li>
            <li>
              <span className="inline-block w-24 font-bold text-red-600">
                FALSE
              </span>
              if the statement contradicts the information
            </li>
            <li>
              <span className="inline-block w-24 font-bold text-gray-600">
                NOT GIVEN
              </span>
              if there is no information on this
            </li>
          </ul>

          <div className="space-y-6">
            {TF_QUESTIONS.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-gray-200 hover:shadow-md transition-all"
              >
                {/* Statement */}
                <p className="font-semibold text-gray-900 mb-4 leading-7">
                  <span className="font-bold mr-1">{q.id}.</span>
                  {q.text}
                </p>

                {/* Radio options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 pl-4">
                  {[
                    { label: "TRUE", color: "text-green-700" },
                    { label: "FALSE", color: "text-red-600" },
                    { label: "NOT GIVEN", color: "text-gray-600" },
                  ].map((opt) => (
                    <label
                      key={opt.label}
                      className="flex items-center gap-2 cursor-pointer "
                    >
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value={opt.label}
                        checked={answers[q.id] === opt.label}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        className="w-5 h-5 accent-[#0E4BA9] cursor-pointer"
                      />
                      <span
                        className={`font-medium ${opt.color} group-hover:underline`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="text-center mt-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="px-10 py-4 bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
          >
            ✅ Nộp bài Reading
          </motion.button>

          <p className="text-gray-500 text-sm mt-3">
            *Hãy chắc chắn rằng bạn đã trả lời tất cả trước khi nộp.*
          </p>
        </div>
      </div>
    </>
  );
}
